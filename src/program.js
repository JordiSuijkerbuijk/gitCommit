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

let counts = [0, 0];

async function getGitDirectory(callback = () => {}) {
      counts[0] += 1;
      const { stdout, stderr } = await exec(
        `git log  --pretty=format:"${format}|@|" --since="${since.format()}" --until="${until.format()}" --author="${user}" --no-merges --reverse`
      );

      const isValid = !stderr && stdout !== '';
      counts[1] += 1;

      if (_jsonResponse && isValid) {
        const regex = new RegExp(`\n||@|`, 'g');
        result.entries.push(
          ...stdout
            .split('|@|')
            .map((output) => ({ commit: output.replace(regex, '')}))
            .filter((e) => e.commit)
        );
      }

      if (counts[0] === counts[1]) {
        callback();
  }
}

async function program(program = {}) {
  format = dlv(program, 'format', '%an <%ae> - %s');
  user = program.user ? program.user : '.*';
  day = dlv(program, 'day', null)
  _jsonResponse = true;

  const currentDate = dayjs();

  since = setTime(day ? dayjs(day) : currentDate, {time: 'morning'});
  until = setTime(day ? dayjs(day) : currentDate, {time: 'night'});

  formattedSince = since.format('DD-MM-YYYY');
  formattedUntil = until.format('DD-MM-YYYY');

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
    getGitDirectory(() => {
        if (result.entries.length) result.entries.map((item) => console.log(item.commit));
      
      return resolve(result);
    });
  });
}

module.exports = program;
