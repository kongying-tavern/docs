---
title: [Launch Error] Empty Dialog Box or Stuck Progress Bar
---

# [Launch Error] Empty Dialog Box or Stuck Progress Bar
There are three likely scenarios,

  1. the client is stuck on 0%, and displays an empty dialogue
<div align="center"><img src="image\1.png"><br>(A firewall has blocked the API request, check your firewall and anti-virus provider)</div><br>

  2. the client is stuck on 0%, no dialogue appears
<div align="center"><img src="image\2.jpeg"><br>(Cache is corrupted, head to the location in the following picture and delete PlayerPrefs.json)</div>
<div align="center"><img src="image\3.png"></div><br>
  
  3. the client is stuck on 100%, with no dialogue, this is a version 1.11 bug contained in the login module, and it can be resolved with the same method in scenario 2.