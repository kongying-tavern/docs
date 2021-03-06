import { ref } from 'vue'
import { dayjs } from '../utils'

import type { Ref } from 'vue'

/**
 * @description: 每一笔赞助，name 为 key。
 * @param name 赞助者的姓名，不可为空。
 * @param avatarURL 赞助者的头像链接，可为空。
 * @param platform 该笔赞助的赞助平台，可为空。
 * @param sum 该笔赞助的金额，不可为空。
 * @param date 该笔赞助的日期，格式为 yyyy-mm-dd。不可为空未知可填 '1970-01-01'。
 * @param remark 该笔赞助的备注，可为空。
 */

export interface backersItem {
  name: string
  avatarURL?: string | null
  sum: string | null
  date: string | '1970-01-01'
  platform?: string | null
  remark?: string | null
}

export const useBackersList = function (): Ref<backersItem[]> {
  return ref(
    [
      {
        platform: null,
        avatarURL: null,
        remark: null,
        name: 'was',
        sum: '98',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        name: 'Kccly',
        sum: '98',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: 'XXCF.png',
        remark: null,
        name: '**枫',
        sum: '12',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: 'XXZF.png',
        name: '**锋',
        remark: null,
        sum: '11',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        name: 'sum',
        sum: '10',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        name: '2333',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        name: 'Ciitta',
        sum: '10',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        name: '*世',
        sum: '10',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        name: '舟舟哥哥',
        sum: '6',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: 'XXJP.png',
        name: '**鹏',
        sum: '5',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: 'XXXQ.png',
        name: '*强',
        sum: '5',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        name: '**洋',
        sum: '4',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        name: '*w',
        sum: '2',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        name: 'Hanxi小毛怪',
        sum: '1',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        name: '浅念',
        sum: '1',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        name: 'Aliceshift',
        sum: '1',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: 'XXMH.png',
        name: '**晗',
        sum: '1',
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        name: 'kmmmm',
        sum: '1',
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: 'uukong',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '运输队长常凯申',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '星星的祈愿',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '赛鹿鹿',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: 'adslgg1716',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '诶嘿',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '黑棉种植真君',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: 'qwertaswl',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '天蝎',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '烟雨蒙蒙',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: 'aqua',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '诶嘿',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: 'gokoushiro',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: 'adslgg1716',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '爱发电用户_6Faj',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: 'jiujiezzz',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '爱发电用户_sqUS',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '爱发电用户_tVSC',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '原神醪',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '赛鹿鹿',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '道易',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: 'qwertaswl',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '秋东',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '星星的祈愿',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '凛夜',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '爱发电用户_ChqQ',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '运输队长常凯申',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '烟雨蒙蒙',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: 'revton',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: 'uukong',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: 'ZlCr',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '淘淘巷',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: 'XIAOYAO',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',

        avatarURL: null,
        remark: null,
        name: '欧皇面',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: 'eleven',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '爱发电用户_FknQ',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: 'momocoo',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '墨大喵',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: '爱赞助',
        avatarURL: null,
        remark: null,
        name: '背石头的猫',
        sum: null,
        date: '1970-01-01',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '100',
        name: '**和',
        date: '2021-06-13',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '20',
        name: '**平',
        date: '2021-06-26',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '88',
        name: '*真',
        date: '2021-07-01',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '100',
        name: '*🍉',
        date: '2021-07-04',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '6',
        name: '-*-',
        date: '2021-07-07',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '2',
        name: '**孝',
        date: '2021-07-07',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '20',
        name: '**樑',
        date: '2021-07-09',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '*硕',
        date: '2021-07-11',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '1000',
        name: '**杰',
        date: '2021-07-13',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '5',
        name: 'L*G',
        date: '2021-07-15',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '1',
        name: '*L',
        date: '2021-07-15',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '100',
        name: '*样',
        date: '2021-07-17',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '4*D',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '1',
        name: '*逸',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '5',
        name: '*叶',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '1.16',
        name: 'w*w',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: 'T*y',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '1',
        name: '*玖',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '*草',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '5',
        name: '*人',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '1',
        name: '*丘',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '*径',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '5',
        name: '*下',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '5',
        name: '*.',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '*琦',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '20',
        name: '*-',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '30',
        name: '*🐾',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '*🍌',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '6',
        name: '**宏',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '20',
        name: '**煊',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '1',
        name: '**清',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '6',
        name: '**峰',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '1',
        name: '**杰',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '6',
        name: '*璐',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '6',
        name: '**凯',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '5',
        name: '*刚',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '*翔',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '6.15',
        name: 'Accelerator',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '2',
        name: '澪依/LingYi',
        date: '2021-07-21',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '2.88',
        name: '跟*i',
        date: '2021-07-22',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '1000',
        name: '**杰',
        date: '2021-07-22',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '*子',
        date: '2021-07-22',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '30',
        name: 'T*t',
        date: '2021-07-22',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '5',
        name: '*诚',
        date: '2021-07-22',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '20',
        name: '**娟',
        date: '2021-07-22',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '1',
        name: '*辉',
        date: '2021-07-22',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '3',
        name: '*扶',
        date: '2021-07-22',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '30',
        name: '*宇',
        date: '2021-07-22',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '1',
        name: '**翔',
        date: '2021-07-22',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '5',
        name: '**治',
        date: '2021-07-22',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '5',
        name: '*江',
        date: '2021-07-23',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '30',
        name: '*丸',
        date: '2021-07-23',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '83.46',
        name: 'C*h',
        date: '2021-07-23',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '5',
        name: '*聚',
        date: '2021-07-23',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '**毅',
        date: '2021-07-23',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '5',
        name: '**宇',
        date: '2021-07-23',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '1',
        name: 'h*n',
        date: '2021-07-23',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '8.88',
        name: 'k*.',
        date: '2021-07-23',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '20',
        name: '*晗',
        date: '2021-07-23',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '100',
        name: '**谣',
        date: '2021-07-23',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '100',
        name: '**园',
        date: '2021-07-23',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '*花',
        date: '2021-07-23',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '*。',
        date: '2021-07-23',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '0.01',
        name: '*。',
        date: '2021-07-23',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '2',
        name: '*下',
        date: '2021-07-24',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '5',
        name: '*。',
        date: '2021-07-24',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '2',
        name: '*ウ',
        date: '2021-07-24',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '*离',
        date: '2021-07-24',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '*朱',
        date: '2021-07-24',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '*家',
        date: '2021-07-24',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '*辉',
        date: '2021-07-24',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '5',
        name: 'P*e',
        date: '2021-07-24',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '5',
        name: '*涛',
        date: '2021-07-24',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '38',
        name: '**泉',
        date: '2021-07-24',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '20',
        name: '**皓',
        date: '2021-07-24',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '**杰',
        date: '2021-07-24',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: '*意',
        date: '2021-07-24',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '100',
        name: '*🌚',
        date: '2021-07-25',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '20',
        name: '*k',
        date: '2021-07-25',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '20',
        name: 'u*l',
        date: '2021-07-25',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: 'p*n',
        date: '2021-07-25',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '2',
        name: '**言',
        date: '2021-07-25',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '15',
        name: '*硕',
        date: '2021-07-25',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '68',
        name: '*天',
        date: '2021-07-25',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '10',
        name: 'S*i',
        date: '2021-07-25',
      },
      {
        platform: null,
        avatarURL: null,
        remark: null,
        sum: '1',
        name: '*呐',
        date: '2021-07-26',
      },
    ].sort((x, y) => Number(dayjs(x.date).isBefore(dayjs(y.date), 'day')))
  )
}
