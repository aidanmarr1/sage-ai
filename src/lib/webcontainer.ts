import { WebContainer } from "@webcontainer/api";

let webcontainerInstance: WebContainer | null = null;
let bootPromise: Promise<WebContainer> | null = null;

export async function getWebContainer(): Promise<WebContainer> {
  // Return existing instance if available
  if (webcontainerInstance) {
    return webcontainerInstance;
  }

  // Return existing boot promise if booting
  if (bootPromise) {
    return bootPromise;
  }

  // Boot new instance
  bootPromise = WebContainer.boot();
  webcontainerInstance = await bootPromise;
  bootPromise = null;

  return webcontainerInstance;
}

export async function spawnShell(
  webcontainer: WebContainer,
  onData: (data: string) => void
) {
  const shellProcess = await webcontainer.spawn("jsh", {
    terminal: {
      cols: 80,
      rows: 24,
    },
  });

  shellProcess.output.pipeTo(
    new WritableStream({
      write(data) {
        onData(data);
      },
    })
  );

  const input = shellProcess.input.getWriter();

  return {
    write: (data: string) => input.write(data),
    resize: (cols: number, rows: number) => shellProcess.resize({ cols, rows }),
    kill: () => shellProcess.kill(),
  };
}

// Initial files for the WebContainer filesystem
export const initialFiles = {
  "package.json": {
    file: {
      contents: JSON.stringify(
        {
          name: "sage-workspace",
          type: "module",
          scripts: {
            dev: "node index.js",
          },
        },
        null,
        2
      ),
    },
  },
  "index.js": {
    file: {
      contents: `console.log("Welcome to Sage Workspace!");
console.log("You can run commands like: ls, cat, node, npm, etc.");
console.log("");
`,
    },
  },
  "README.md": {
    file: {
      contents: `# Sage Workspace

This is your personal development environment.

## Available Commands
- \`ls\` - List files
- \`cat <file>\` - View file contents
- \`node <file>\` - Run JavaScript
- \`npm install <package>\` - Install packages
- \`npm run dev\` - Run dev script

Happy coding!
`,
    },
  },
};
