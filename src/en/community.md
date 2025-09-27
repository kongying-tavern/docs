---
title: Join Community
layout: doc
---

## Community Server

<LinkGrid :items="server" />

## QQ Groups

We recommend joining groups with fewer members. By applying to join a group, you agree to accept the "QQ Community Convention" below.

> Please do not join multiple groups. Due to group balance requirements, if you join multiple groups, you will be removed from the "group with more members"!

:::details QQ Community Convention

1. Do not join multiple groups repeatedly. If you are in multiple group chats at the same time, you will be directly removed from the group with more members.
2. It is prohibited to publish bloody violence, horror, pornography (including edge-wiping) and any content that causes serious disgust among most members.
3. It is strictly prohibited to engage in politics and discuss sensitive topics (including hints and other forms)
4. Any behavior that affects the normal group chat atmosphere is prohibited, including but not limited to verbal abuse, personal attacks, malicious harassment, and spreading negative comments. Please moderate your jokes.
5. Please do not spread unverified information. Please verify the authenticity before forwarding information. Don't spread rumors and don't believe rumors. Everything is subject to official information.
6. Please do not talk about personal privacy information. Protect personal information and property security, and personal account security.
7. It is prohibited to send various advertisements, QR codes, and unrelated links (including but not limited to boosting, game promotion, group buying, private servers, cheats, etc.)
8. Please do not maliciously refresh the screen (the same content or picture exceeds 3 times within 1 minute is considered as refreshing the screen)
9. Please do not initiate or send: group calls, small group red envelopes (less than 0.5/10 people), voice/password red envelopes, group votes and other functions that have a big impact on group members.
10. If you violate the group rules, depending on the situation and number of times, you will be given: warning and silence for 10 minutes/silence for 1 hour/silence for 12 hours/kicked out of the group chat and other treatments.

:::

<QQGroupList />

<script setup lang="ts">
import { serverLink } from '../components/links/Community'
import QQGroupList from '@/components/QQGroupList.vue'

const server = [
  serverLink('discord', 'Discord')
]
</script>

