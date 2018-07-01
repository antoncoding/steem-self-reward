var fs = require("fs");
const steem = require('steem');
var utils = require('./utils');
var parent_comment_permlink = null;
var version = '1.0';
var error_count = 0;
start();

function start(){
  config = JSON.parse(fs.readFileSync("config.json"));
  var rpc_node = config.rpc_nodes ? config.rpc_nodes[0] : (config.rpc_node ? config.rpc_node : 'https://api.steemit.com');
  steem.api.setOptions({ transport: 'http', uri: rpc_node, url: rpc_node });
  utils.log(" Connected to:" + rpc_node);
  utils.updateSteemVariables();
  startProcess();

  setInterval(startProcess, config.interval_milisec);
}

function startProcess(){
  steem.api.getAccounts([config.account], function (err, result) {
  if (result && !err) {
    account = result[0];
    if (account){
      claimRewards();
      // Load the current voting power of the account
      var vp = utils.getVotingPower(account);
      var threshold = config.voting_power_threshold;
      if (vp >= threshold) {
        // Time to Upvote your own comment!
        utils.log('Voting Power threshold ' + threshold/100 +' reached!');
        if(!parent_comment_permlink){
          // We Dont have a parent comment under permlink yet, create one
          var post_permlink = config.target_permlink;
          var post_author = config.target_author;
          steem.api.getContent(post_author, post_permlink, function (err, result) {
            if (!err && result && result.id > 0) {
                if(result.parent_author == null || result.parent_author == '') {
                  // Create a parent_comment first
                  parent_comment_permlink = 're-' + post_author.replace(/\./g, '') + '-' + post_permlink + '-' + new Date().toISOString().replace(/-|:|\./g, '').toLowerCase();
                  var content = config.parent_comment_content;
                  // Broadcast Commments
                  steem.broadcast.comment(config.posting_key, post_author, post_permlink, account.name, parent_comment_permlink, 'self-reward', content, '{"app":"self-reward/'+version+'"}', function (err, result) {
                    if (!err && result) {
                      utils.log('Comment posted: ' + parent_comment_permlink);
                      // Vote for the first time: on parent comment
                      vote(account.name, parent_comment_permlink, config.voting_weight, 1)
                    } else {
                      logError('Error posting comment: ' + parent_comment_permlink);
                    }
                  });
                }
             }
             else{
               logError('getContent Error: '+err);
             }
           });
        }
        else{
          // create comment under parent_comment and vote
          child_comment_permlink = 're-' + account.name.replace(/\./g, '') + '-' + parent_comment_permlink + '-' + new Date().toISOString().replace(/-|:|\./g, '').toLowerCase();
          var content = config.parent_comment_content;
          // Broadcast Child Commments
          steem.broadcast.comment(config.posting_key, account.name, parent_comment_permlink, account.name, child_comment_permlink, 'self-reward', content, '{"app":"self-reward/'+version+'"}', function (err, result) {
            if (!err && result) {
              utils.log('Comment posted: ' + parent_comment_permlink);

              // Vote on child_comment
              vote(account.name, child_comment_permlink, config.voting_weight, 1)

            } else {
              logError('Error posting comment: ' + parent_comment_permlink);
            }
          });
        }
      }
      else{
        var wait_time = utils.timeTilNextVote(vp, config.voting_power_threshold);
        if(config.detail_logging){
          utils.log('Current Power: '+ vp/100 + '%');
          utils.log('Time Tils next vote: '+ wait_time/60 + ' mins.');
        }
      }
    }else{
      utils.log('Account Fetch Error')
    }

    }
  });
}

function vote(author, permlink, weight,retries){
  steem.broadcast.vote(config.posting_key, account.name, author, permlink, weight, function (err, result) {
    if (!err && result) {
      utils.log(utils.format(weight / 100) + '% vote cast for: @' + author + '/' + permlink);
    }
  });
}

function claimRewards() {

  // Make api call only if you have actual reward
  if (parseFloat(account.reward_steem_balance) > 0 || parseFloat(account.reward_sbd_balance) > 0 || parseFloat(account.reward_vesting_balance) > 0) {
    steem.broadcast.claimRewardBalance(config.posting_key, config.account, account.reward_steem_balance, account.reward_sbd_balance, account.reward_vesting_balance, function (err, result) {
      if (err) {
        utils.log('Error claiming rewards...');
      }

      if (result) {
        var rewards_message = "$$$ ==> Rewards Claim";
        if (parseFloat(account.reward_sbd_balance) > 0) { rewards_message = rewards_message + ' SBD: ' + parseFloat(account.reward_sbd_balance); }
        if (parseFloat(account.reward_steem_balance) > 0) { rewards_message = rewards_message + ' STEEM: ' + parseFloat(account.reward_steem_balance); }
        if (parseFloat(account.reward_vesting_balance) > 0) { rewards_message = rewards_message + ' VESTS: ' + parseFloat(account.reward_vesting_balance); }

        utils.log(rewards_message);

        // If there are liquid SBD rewards, withdraw them to the specified account
        if(parseFloat(account.reward_sbd_balance) > 0 && config.post_rewards_withdrawal_account && config.post_rewards_withdrawal_account != '') {

          // Send liquid post rewards to the specified account
          steem.broadcast.transfer(config.active_key, config.account, config.post_rewards_withdrawal_account, account.reward_sbd_balance, 'Liquid Post Rewards Withdrawal', function (err, response) {
            if (err)
              utils.log(err, response);
            else {
              utils.log('$$$ Auto withdrawal - liquid post rewards: ' + account.reward_sbd_balance + ' sent to @' + config.post_rewards_withdrawal_account);
            }
          });
        }

				// If there are liquid STEEM rewards, withdraw them to the specified account
        if(parseFloat(account.reward_steem_balance) > 0 && config.post_rewards_withdrawal_account && config.post_rewards_withdrawal_account != '') {

          // Send liquid post rewards to the specified account
          steem.broadcast.transfer(config.active_key, config.account, config.post_rewards_withdrawal_account, account.reward_steem_balance, 'Liquid Post Rewards Withdrawal', function (err, response) {
            if (err)
              utils.log(err, response);
            else {
              utils.log('$$$ Auto withdrawal - liquid post rewards: ' + account.reward_steem_balance + ' sent to @' + config.post_rewards_withdrawal_account);
            }
          });
        }
      }
    });
  }
}



// From Postpromoter
function logError(message) {
  // Don't count assert exceptions for node failover
  if (message.indexOf('assert_exception') < 0 && message.indexOf('ERR_ASSERTION') < 0)
    error_count++;

  utils.log('Error Count: ' + error_count + ', Current node: ' + steem.api.options.url);
  utils.log(message);
}
