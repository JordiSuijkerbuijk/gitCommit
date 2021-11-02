const { readdirSync, lstatSync } = require('fs');
const { join } = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const dlv = require('dlv');
const dayjs = require('dayjs');
const {bold, yellow} = require('kleur');

let _jsonResponse,
  format,
  day,
  user = true,
  formattedSince,
  formattedUntil;

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

let counts = [0, 0];

async function getGitDirectory(directories, callback = () => {}) {
  for (let i = 0; i < directories.length; i += 1) {
    const directory = directories[i];

    if (directory.match(/\.git/)) {
      counts[0] += 1;
      const { stdout, stderr } = await exec(
        `cd ${directory}; git log  --pretty=format:"${format}|@|" --since="${since.format()}" --until="${until.format()}" --author="${user}" --no-merges --reverse`
      );

      const isValid = !stderr && stdout !== '';
      counts[1] += 1;

      if (_jsonResponse && isValid) {
        result.directories.push(directory);
        const regex = new RegExp(`\n||@|`, 'g');
        result.entries.push(
          ...stdout
            .split('|@|')
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

  formattedSince = since.format('DD-MM-YYYY');
  formattedUntil = until.format('DD-MM-YYYY');

  const directories = getDirectoriesFromPath(process.cwd());

  console.log(
    yellow(
      bold(
        `Getting git logs for ${formattedSince}${
          formattedSince !== formattedUntil
            ? ` to ${formattedUntil}:`
            : ':'
        }`
      )
    )
  );

  return new Promise((resolve) => {
    getGitDirectory(directories, () => {
        if (result.entries.length) result.entries.map((item) => console.log(item.commit));
      
      return resolve(result);
    });
  });
}

module.exports = program;
