#!/usr/bin/env node
const program = require('commander');

const runApplication = async () => {
  program.name('t');
  program.version('0.0.1');

  //program options
  program
    .option('-u, --user <user>', 'git user', false)
    .option('-d, --day <YYYY-MM-DD>', 'date of specific day', false)
    .option('-p, --path <path>', 'repository path', __dirname)
    .option(
      '--format <format>',
      'formats the git output (default is "%an <%ae> - %s"',
      '%an <%ae> - %s'
    );
  // .option('-j, --json', 'return a json response', false);

  program.parse(process.argv);

  require('./program')(program);
};

runApplication();
