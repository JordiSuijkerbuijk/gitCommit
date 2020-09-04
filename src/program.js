const { readdirSync } = require('fs');
const dlv = require('dlv');

// let error = '';

function getGitDirectoriesFromPath(source) {
  console.log('return readdirSync(source)', readdirSync(source));
  // error = 'no path';
  // return undefined;
}

// function isDirectory(source) {
//   return lstatSync(source).isDirectory();
// }

// function getGitDirectoriesFromPath(source) {
//   return readdirSync(source)
//     .map((name) => join(source, name))
//     .filter(isDirectory);
// }

// async function getGitDirectory(items) {
//   const terminalLine = await exec();
// }

async function program(program = {}, jsonResponse = true, cli = false) {
  // const day = dlv(program, 'day', '');
  const path = dlv(program, 'path', '');
  // console.log('path', path);

  const directories = getGitDirectoriesFromPath(path);
  console.log('directories', directories);

  // if (directories !== undefined) {
  //   return new Promise((resolve) => {
  //     // getGitDirectory(directories, () => {
  //     //   if (cli) console.log(result);
  //     //   return resolve(result);
  //     // });
  //   });
  // }
  return new Promise((resolve) => {});
}

module.exports = program;
