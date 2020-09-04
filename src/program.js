const { readdirSync, lstatSync } = require('fs');
const { join } = require('path');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const dlv = require('dlv');

let _jsonResponse,
  format = true;
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
    const appendForSplit = '|@|';
    const f = `${format}${_jsonResponse ? appendForSplit : ''}`;
    if (directory.match(/\.git/)) {
      counts[0] += 1;
      const { stdout, stderr } = await exec(
        `cd ${directory}; git log  --pretty=format:"${f}" --no-merges --reverse`
      );

      const isValid = !stderr && stdout !== '';
      counts[1] += 1;

      if (_jsonResponse && isValid) {
        result.directories.push(directory);
        const regex = new RegExp(`\n|${appendForSplit}`, 'g');
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

async function program(program = {}, jsonResponse = true, cli = false) {
  // const day = dlv(program, 'day', '');
  format = dlv(program, 'format', '%an <%ae> - %s');
  _jsonResponse = program.json || jsonResponse;
  const path = dlv(program, 'path', '');

  const directories = getDirectoriesFromPath(path);

  if (_jsonResponse === false) return getGitDirectory(directories);

  return new Promise((resolve) => {
    getGitDirectory(directories, () => {
      if (cli) console.log(result.entries);
      return resolve(result);
    });
  });
  // return new Promise((resolve) => {});
}

module.exports = program;
