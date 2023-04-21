---
title: [Launch Error] Empty Dialog Box or Stuck Progress Bar
---

# [Launch Error] Empty Dialog Box or Stuck Progress Bar

There are three likely scenarios,

1. the client is stuck on 0%, and displays an empty dialogue
1. ![1](/imgs/manual/1.png)
   (A firewall has blocked the API request, check your firewall and anti-virus provider)

1. the client is stuck on 0%, no dialogue appears
1. ![2](/imgs/manual/2.jpeg)"(Cache is corrupted, head to the location in the following picture and delete PlayerPrefs.json)
1. ![3](/imgs/manual/3.png)

1. the client is stuck on 100%, with no dialogue, this is a version 1.11 bug contained in the login module, and it can be resolved with the same method in scenario 2.
