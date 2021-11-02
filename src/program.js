const { readdirSync, lstatSync } = require('fs');
const { join } = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const dlv = require('dlv');
const dayjs = require('dayjs');

let _jsonResponse,
  format,
  day,
  user = true;

const result = {
  directories: [],
  entries: [],
};

function setTime(date, { time = 'morning' }) {
  return date
    .set('hour', time === 'morning' ? 0 : 23)
    .set('minute', time === 'morning' ? 0 : 59)
    .set('second', time === 'morning' ? 0 : 59);
}

function isDirectory(source) {
  return lstatSync(source).isDirectory();
}

function getDirectoriesFromPath(source) {
  return readdirSync(source)
    .map((name) => join(source, name))
    .filter(isDirectory);
}

function gitTimeFormat(date) {
  return date.format();
}

let counts = [0, 0];

async function getGitDirectory(directories, callback = () => {}) {
  for (let i = 0; i < directories.length; i += 1) {
    const directory = directories[i];
    if (directory.match(/\.git/)) {
      counts[0] += 1;
      const { stdout, stderr } = await exec(
        `cd ${directory}; git log  --pretty=format:"${format}" --since="${gitTimeFormat(since)}" --until="${gitTimeFormat(until)}" --no-merges --reverse --author="${user}"`
      );

      const isValid = !stderr && stdout !== '';
      counts[1] += 1;

      if (_jsonResponse && isValid) {
        result.directories.push(directory);
        const regex = new RegExp(`\n||@|`, 'g');
        result.entries.push(
          ...stdout
            .split('\n\n')
            .map((output) => ({ commit: output.replace(regex, ''), directory }))
            .filter((e) => e.commit)
        );
      }

      if (counts[0] === counts[1]) {
        callback();
      }
    }
  }
}

async function program(program = {}) {
  format = dlv(program, 'format', '%an <%ae> - %s');
  user = program.user ? program.user : '.*';
  day = dlv(program, 'day', null)
  // const path = dlv(program, 'path', '');
  _jsonResponse = true;

  const currentDate = dayjs();

  since = setTime(day ? dayjs(day) : currentDate, {time: 'morning'});
  until = setTime(day ? dayjs(day) : currentDate, {time: 'night'});

  const directories = getDirectoriesFromPath(process.cwd());

  return new Promise((resolve) => {
    getGitDirectory(directories, () => {
        if (result.entries.length) result.entries.map((item) => console.log(item.commit));
      
      return resolve(result);
    });
  });
}

module.exports = program;
