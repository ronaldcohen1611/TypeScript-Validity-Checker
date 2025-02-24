import { exec, execSync } from 'child_process';
import readline from 'readline';
import chalk from 'chalk';

const errorRegex =
  /[^\s]+\.(ts|tsx)\(\d+,\d+\):[\s\S]+?(?=[^\s]+\.(ts|tsx)\(\d+,\d+\):|$)/g;
const pathRegex = /([^\s]+\.(ts|tsx)?\(\d+,\d+\)):/g;
let spinnerIndex = 0;
const spinnerFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

const restoreCursorAndClearScreen = () => {
  process.stdout.write('\x1B[?25h'); // Show the cursor
  process.stdout.write('\x1B[2J\x1B[0;0H'); // Clear the screen and move cursor to top-left
};

const restoreCursor = () => process.stdout.write('\x1B[?25h');
process.on('exit', restoreCursor);
process.on('SIGINT', () => {
  restoreCursorAndClearScreen();
  process.exit();
});

// Hide the cursor
process.stdout.write('\x1B[?25l');

process.stdout.write('\n');

const spinnerInterval = setInterval(() => {
  readline.cursorTo(process.stdout, 0);
  const spinnerText = `${chalk.blueBright('🚀 TS Validation Checker')} is validating your project ${chalk.blueBright(spinnerFrames[spinnerIndex])}`;
  process.stdout.write(spinnerText);
  readline.cursorTo(process.stdout, spinnerText.length + 1);
  spinnerIndex = (spinnerIndex + 1) % spinnerFrames.length;
}, 100);

// Check for command-line argument
const pnpmPathArg = process.argv[2];
let pnpmPath;

if (pnpmPathArg) {
  pnpmPath = pnpmPathArg;
} else {
  try {
    pnpmPath = findPnpmPath();
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

function findPnpmPath() {
  try {
    const command = process.platform === 'win32' ? 'where pnpm' : 'which pnpm';
    const pnpmPath = execSync(command).toString().trim();
    return pnpmPath;
  } catch {
    throw new Error(
      'pnpm is not installed or not found in PATH. Please pass the path of where pnpm is installed as a argument',
    );
  }
}

const formatPath = (path) => {
  const parts = path.split('(');
  const [line, column] = parts[1].replace('):', '').split(',');
  return { line, column, path: parts[0] };
};

exec(
  `${pnpmPath} tsc --noEmit --project tsconfig.check.json`,
  (runtimeError, stdout, stderr) => {
    clearInterval(spinnerInterval);
    readline.clearLine(process.stdout, 0);
    readline.cursorTo(process.stdout, 0);

    // Show the cursor again
    process.stdout.write('\x1B[?25h');

    const errors = stdout.match(errorRegex);
    const paths = stdout.match(pathRegex);

    restoreCursor();

    if (runtimeError) {
      console.error(
        `💢 ${chalk.blueBright.bold('TS Validity Failed:')} ${chalk.yellowBright.bold(`Found ${errors.length} ${errors.length > 1 ? 'Errors' : 'Error'}`)}\n`,
      );

      if (stderr) {
        console.error(
          chalk.bgBlueBright.bold(`stderr:`) +
            ' ' +
            chalk.redBright.bold(stderr),
        );
        console.log('\n');
      }

      if (errors) {
        console.error(chalk.bgBlueBright.bold(`stdout:`));
        errors.forEach((match, idx) => {
          const { path, line, column } = formatPath(paths[idx]);
          console.error(
            chalk.greenBright.bold(
              `${path}` +
                chalk.yellowBright(` Line: ${line} Column: ${column} `) +
                '\n' +
                chalk.redBright(`${match.replace(paths[idx], '')}`),
            ),
          );
        });
      }

      return;
    }
    if (stderr) {
      console.error(
        chalk.bold.blue(`TypeScript errors:\n`) + chalk.red.bold(stderr),
      );
      return;
    }
    console.log(
      chalk.green(
        '✔️ ✔️  TypeScript validation-checking completed successfully. Happy shipping 🤗\n',
      ),
    );
  },
);
