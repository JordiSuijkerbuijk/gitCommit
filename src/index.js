#!/usr/bin/env node
const program = require('commander');

const runApplication = async () => {
  program.version('0.0.1');

  //program options
  program
    .option('--user <user>', 'git user', false)
    .option('-d, --day <YYYY-MM-DD>', 'date of specific day', false)
    .option('--repository-path <path>', 'repository path', __dirname);

  program.parse(process.argv);

  require('./program')(program, false, true);
};

runApplication();
