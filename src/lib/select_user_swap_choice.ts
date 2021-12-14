'use strict'
import inquirer = require('inquirer')
import yaml from 'js-yaml'
import fs from 'node:fs'
import {IPartitions} from '../interfaces'

export default async function selectUserSwapChoice(): Promise<string> {
  let partitions = {} as IPartitions
  if (fs.existsSync('/etc/calamares/modules/partition.conf')) {
    partitions = yaml.load(fs.readFileSync('/etc/calamares/modules/partition.conf', 'utf-8')) as unknown as IPartitions
  } else {
    partitions.userSwapChoices = ['none', 'small', 'suspend', 'file']
    partitions.initialSwapChoice = 'small'
  }

  const questions: Array<Record<string, any>> = [
    {
      type: 'list',
      name: 'userSwapChoices',
      message: 'Select the swap choice',
      choices: partitions.userSwapChoices,
      default: partitions.initialSwapChoice,
    },
  ]

  return new Promise(function (resolve) {
    inquirer.prompt(questions).then(function (options) {
      resolve(options.userSwapChoices)
    })
  })
}
