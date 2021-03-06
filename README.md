# Self-reward on Steem

## Overview
This script is created by [@antonsteemit](https://steemit.com/@antonsteemit), user can log in with their steem `posting_key`, and the script will automatically generate comments and vote on them. You can customize `voting weight` and `voting power threshold` to fit your needs, so that we can be sure that no voting power is wasted while we're asleep.

![](cover.png)

## Installation
* You need to have `nodejs` installed to run the script.

```
$ git clone https://github.com/antoncoding/steem-self-reward.git
$ npm install
```

## Configuration
Rename `config-example.json` to `config.json`:
```
$ mv config-example.json config.json
```
Set the options in `config.json`:
```
{
  "rpc_nodes": [
    "https://api.steemit.com",
    "https://rpc.buildteam.io",
    "https://steemd.minnowsupportproject.org",
    ],
    "comment_poster":"account_to_comment",
    "comment_posting_key":"posting_key",
    "voters":[
      {
        "account": "voter1",
        "posting_key": "posting_key_1"
      },
      {
        "account": "voter2",
        "posting_key" :"posting_key_2"
      },
      {
        "account":"voter3",
        "posting_key":"posting_key_3"
      }
    ],

  "target_author":"self-reward", // Info about target post you want to create your comments on, feel free to just use this one :)
  "target_permlink":"save-your-wasted-sp-and-maximize-your-incom-on-steem",
  "parent_comment_content":"This is a comment created for self-reward.",
  "voting_power_threshold":10000, // create new comment and vote when 100% voting power reached.
  "voting_weight":10000, // Vote with 100% voting weight
  "interval_milisec":300000, // check interval in 1/1000 sec, 300 secs -> 5 mins
  "detail_logging":true
}

```

## Run
```
$ node self-reward.js
```

## Donation:
I'll appreciate it if you want to buy me a cup of **bubble tea** :)
* Steem account: [@self-reward](https://steemit.com/@self-reward) or [@antonsteemit](https://steemit.com/@antonsteemit)
