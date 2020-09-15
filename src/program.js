const { readdirSync, lstatSync } = require('fs');
const { join } = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const dlv = require('dlv');

let _jsonResponse,
  format,
  day,
  user = true;

const result = {
  directories: [],
  entries: [],
};

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
    const f = `${format}|@|`;
    if (directory.match(/\.git/)) {
      counts[0] += 1;
      const { stdout, stderr } = await exec(
        `cd ${directory}; git log  --pretty=format:"${f}" --no-merges --reverse --author="${user}"`
      );

      const isValid = !stderr && stdout !== '';
      counts[1] += 1;

      if (_jsonResponse && isValid) {
        result.directories.push(directory);
        const regex = new RegExp(`\n||@|`, 'g');
        result.entries.push(
          ...stdout
            .split(appendForSplit)
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
  const path = dlv(program, 'path', '');
  _jsonResponse = true;

  const directories = getDirectoriesFromPath(path);

  return new Promise((resolve) => {
    getGitDirectory(directories, () => {
        if (result.entries.length) result.entries.map((item) => console.log(item.commit));
      
      return resolve(result);
    });
  });
}

module.exports = program;
