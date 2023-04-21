---
title: \[Launch Error] Empty Dialog Box or Stuck Progress Bar
aside: false
---

# [Launch Error] Empty Dialog Box or Stuck Progress Bar

There are three likely scenarios,

1. the client is stuck on 0%, and displays an empty dialogue

![](./../../../../public/imgs/en/manual/launcherror/1.png)
(A firewall has blocked the API request, check your firewall and anti-virus provider)

2. the client is stuck on 0%, no dialogue appears

![](./../../../../public/imgs/en/manual/launcherror/2.jpeg)
(Cache is corrupted, head to the location in the following picture and delete PlayerPrefs.json)

![](./../../../../public/imgs/en/manual/launcherror/3.png)

3. the client is stuck on 100%, with no dialogue, this is a version 1.11 bug contained in the login module, and it can be resolved with the same method in scenario 2.
