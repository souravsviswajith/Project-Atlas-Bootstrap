export interface ChecklistItem {
  id: string;
  label: string;
  note?: string;
  commands?: string[];
}

export interface Section {
  title: string;
  items: ChecklistItem[];
}

export interface Phase {
  id: string;
  number: number;
  title: string;
  tagline: string;
  icon: string;
  color: string;
  sections: Section[];
}

export const phases: Phase[] = [
  {
    id: "git",
    number: 7,
    title: "Git",
    tagline: "Identity, keys & authentication for source control",
    icon: "GitBranch",
    color: "from-orange-500 to-red-500",
    sections: [
      {
        title: "Identity",
        items: [
          {
            id: "git-name",
            label: "Set your Git user name",
            commands: ['git config --global user.name "Your Name"'],
          },
          {
            id: "git-email",
            label: "Set your Git email",
            note: "Use the same email registered on GitHub for correct commit attribution.",
            commands: ['git config --global user.email "you@example.com"'],
          },
        ],
      },
      {
        title: "SSH Keys",
        items: [
          {
            id: "git-ssh-gen",
            label: "Generate an SSH key pair",
            commands: [
              'ssh-keygen -t ed25519 -C "you@example.com"',
              'eval "$(ssh-agent -s)"',
              "ssh-add ~/.ssh/id_ed25519",
            ],
          },
          {
            id: "git-ssh-add",
            label: "Add the public key to GitHub",
            note: "Copy ~/.ssh/id_ed25519.pub into GitHub → Settings → SSH and GPG keys.",
            commands: ["clip < ~/.ssh/id_ed25519.pub"],
          },
        ],
      },
      {
        title: "GitHub Authentication",
        items: [
          {
            id: "git-gh-cli",
            label: "Authenticate with the GitHub CLI",
            commands: ["gh auth login"],
          },
          {
            id: "git-ssh-test",
            label: "Verify SSH connection to GitHub",
            commands: ["ssh -T git@github.com"],
          },
        ],
      },
      {
        title: "Defaults & Aliases",
        items: [
          {
            id: "git-default-branch",
            label: 'Set default branch name to "main"',
            commands: ["git config --global init.defaultBranch main"],
          },
          {
            id: "git-aliases",
            label: "Configure useful aliases",
            commands: [
              "git config --global alias.co checkout",
              "git config --global alias.br branch",
              "git config --global alias.ci commit",
              "git config --global alias.st status",
              'git config --global alias.lg "log --oneline --graph --decorate --all"',
            ],
          },
        ],
      },
    ],
  },
  {
    id: "vscode",
    number: 8,
    title: "VS Code",
    tagline: "Sync, extensions and editor configuration",
    icon: "Code2",
    color: "from-blue-500 to-cyan-500",
    sections: [
      {
        title: "Settings Sync",
        items: [
          {
            id: "vsc-sync",
            label: "Enable Settings Sync",
            note: "Accounts icon (bottom-left) → Turn on Settings Sync → sign in with GitHub or Microsoft.",
          },
        ],
      },
      {
        title: "Extensions",
        items: [
          { id: "ext-python", label: "Python", commands: ["code --install-extension ms-python.python"] },
          { id: "ext-docker", label: "Docker", commands: ["code --install-extension ms-azuretools.vscode-docker"] },
          {
            id: "ext-devcontainers",
            label: "Dev Containers",
            commands: ["code --install-extension ms-vscode-remote.remote-containers"],
          },
          { id: "ext-gitlens", label: "GitLens", commands: ["code --install-extension eamodio.gitlens"] },
          {
            id: "ext-wsl",
            label: "Remote - WSL",
            commands: ["code --install-extension ms-vscode-remote.remote-wsl"],
          },
          {
            id: "ext-terraform",
            label: "Terraform",
            commands: ["code --install-extension hashicorp.terraform"],
          },
          {
            id: "ext-k8s",
            label: "Kubernetes",
            commands: ["code --install-extension ms-kubernetes-tools.vscode-kubernetes-tools"],
          },
          {
            id: "ext-aws",
            label: "AWS Toolkit",
            commands: ["code --install-extension amazonwebservices.aws-toolkit-vscode"],
          },
          {
            id: "ext-azure",
            label: "Azure Tools",
            commands: ["code --install-extension ms-vscode.vscode-node-azure-pack"],
          },
          { id: "ext-flutter", label: "Flutter", commands: ["code --install-extension Dart-Code.flutter"] },
          { id: "ext-dart", label: "Dart", commands: ["code --install-extension Dart-Code.dart-code"] },
          { id: "ext-java", label: "Java (Extension Pack)", commands: ["code --install-extension vscjava.vscode-java-pack"] },
          { id: "ext-kotlin", label: "Kotlin", commands: ["code --install-extension fwcd.kotlin"] },
          { id: "ext-yaml", label: "YAML", commands: ["code --install-extension redhat.vscode-yaml"] },
          {
            id: "ext-markdown",
            label: "Markdown All in One",
            commands: ["code --install-extension yzhang.markdown-all-in-one"],
          },
          {
            id: "ext-rest",
            label: "REST Client",
            commands: ["code --install-extension humao.rest-client"],
          },
        ],
      },
      {
        title: "Editor Configuration",
        items: [
          {
            id: "vsc-font",
            label: "Set a ligature-friendly font",
            note: 'settings.json → "editor.fontFamily": "Cascadia Code, Fira Code, monospace", "editor.fontLigatures": true',
          },
          {
            id: "vsc-terminal",
            label: "Set default integrated terminal",
            note: 'settings.json → "terminal.integrated.defaultProfile.windows": "PowerShell" (or "WSL")',
          },
          {
            id: "vsc-formatter",
            label: "Install & set Prettier as default formatter",
            commands: [
              "code --install-extension esbenp.prettier-vscode",
              '"editor.defaultFormatter": "esbenp.prettier-vscode"',
            ],
          },
          {
            id: "vsc-autosave",
            label: "Enable Auto Save",
            note: '"files.autoSave": "afterDelay", "files.autoSaveDelay": 1000',
          },
          {
            id: "vsc-formatonsave",
            label: "Enable Format on Save",
            note: '"editor.formatOnSave": true',
          },
        ],
      },
    ],
  },
  {
    id: "languages",
    number: 9,
    title: "Programming Languages",
    tagline: "Runtimes, package managers and version managers",
    icon: "Terminal",
    color: "from-emerald-500 to-teal-500",
    sections: [
      {
        title: "Python",
        items: [
          {
            id: "py-miniconda",
            label: "Install Miniconda",
            commands: ["winget install -e --id Anaconda.Miniconda3"],
          },
          {
            id: "py-uv",
            label: "Install uv (fast package manager)",
            commands: ['powershell -c "irm https://astral.sh/uv/install.ps1 | iex"', "uv --version"],
          },
          {
            id: "py-jupyter",
            label: "Install JupyterLab",
            commands: ["conda install -c conda-forge jupyterlab -y", "jupyter lab --version"],
          },
        ],
      },
      {
        title: "Java",
        items: [
          {
            id: "java-jdk",
            label: "Install JDK 21 LTS (Temurin)",
            commands: ["winget install -e --id EclipseAdoptium.Temurin.21.JDK", "java -version"],
          },
        ],
      },
      {
        title: "Node.js",
        items: [
          {
            id: "node-nvm",
            label: "Install nvm-windows",
            commands: ["winget install -e --id CoreyButler.NVMforWindows"],
          },
          {
            id: "node-lts",
            label: "Install & use latest Node.js LTS",
            commands: ["nvm install lts", "nvm use lts", "node -v && npm -v"],
          },
        ],
      },
      {
        title: "Flutter & Dart",
        items: [
          {
            id: "flutter-sdk",
            label: "Install Flutter SDK",
            commands: ["winget install -e --id Google.Flutter", "flutter --version"],
          },
          {
            id: "dart-sdk",
            label: "Verify Dart (bundled with Flutter)",
            commands: ["dart --version"],
          },
        ],
      },
      {
        title: "Go",
        items: [
          {
            id: "go-install",
            label: "Install latest stable Go",
            commands: ["winget install -e --id GoLang.Go", "go version"],
          },
        ],
      },
    ],
  },
  {
    id: "android",
    number: 10,
    title: "Android Development",
    tagline: "Android Studio, SDK relocation & Flutter doctor",
    icon: "Smartphone",
    color: "from-lime-500 to-green-600",
    sections: [
      {
        title: "Install",
        items: [
          {
            id: "android-studio",
            label: "Install Android Studio",
            commands: ["winget install -e --id Google.AndroidStudio"],
          },
        ],
      },
      {
        title: "Move to D: drive",
        items: [
          {
            id: "android-sdk-move",
            label: "Relocate Android SDK to D:\\Android\\Sdk",
            note: "Android Studio → Settings → Languages & Frameworks → Android SDK → change SDK location, then move the folder.",
            commands: [
              'setx ANDROID_HOME "D:\\Android\\Sdk"',
              'setx ANDROID_SDK_ROOT "D:\\Android\\Sdk"',
            ],
          },
          {
            id: "android-avd-move",
            label: "Relocate AVDs to D:\\Android\\avd",
            commands: ['setx ANDROID_AVD_HOME "D:\\Android\\avd"'],
          },
        ],
      },
      {
        title: "Diagnose",
        items: [
          {
            id: "flutter-doctor",
            label: "Run flutter doctor",
            commands: ["flutter doctor -v"],
          },
          {
            id: "flutter-licenses",
            label: "Accept Android licenses",
            commands: ["flutter doctor --android-licenses"],
          },
          {
            id: "flutter-fix",
            label: "Resolve remaining flutter doctor issues",
            note: "Common fixes: install cmdline-tools & platform-tools, set JAVA_HOME to the JDK 21 path, install Google USB driver, accept all SDK licenses.",
          },
        ],
      },
    ],
  },
  {
    id: "cloud",
    number: 11,
    title: "Cloud & DevOps",
    tagline: "CLIs for AWS, Azure, GCP, Terraform & Kubernetes",
    icon: "Cloud",
    color: "from-sky-500 to-indigo-500",
    sections: [
      {
        title: "AWS",
        items: [
          {
            id: "aws-cli",
            label: "AWS CLI",
            commands: ["winget install -e --id Amazon.AWSCLI", "aws --version"],
          },
          {
            id: "aws-sam",
            label: "AWS SAM CLI",
            commands: ["winget install -e --id Amazon.SAM-CLI", "sam --version"],
          },
          {
            id: "aws-cdk",
            label: "AWS CDK",
            commands: ["npm install -g aws-cdk", "cdk --version"],
          },
        ],
      },
      {
        title: "Azure & Google Cloud",
        items: [
          {
            id: "azure-cli",
            label: "Azure CLI",
            commands: ["winget install -e --id Microsoft.AzureCLI", "az --version"],
          },
          {
            id: "gcloud-cli",
            label: "Google Cloud CLI",
            commands: ["winget install -e --id Google.CloudSDK", "gcloud --version"],
          },
        ],
      },
      {
        title: "Infrastructure & Kubernetes",
        items: [
          {
            id: "terraform-cli",
            label: "Terraform",
            commands: ["winget install -e --id Hashicorp.Terraform", "terraform -version"],
          },
          {
            id: "kubectl-cli",
            label: "kubectl",
            commands: ["winget install -e --id Kubernetes.kubectl", "kubectl version --client"],
          },
          {
            id: "helm-cli",
            label: "Helm",
            commands: ["winget install -e --id Helm.Helm", "helm version"],
          },
          {
            id: "kind-cli",
            label: "kind",
            commands: ["winget install -e --id Kubernetes.kind", "kind version"],
          },
          {
            id: "k9s-cli",
            label: "k9s",
            commands: ["winget install -e --id derailed.k9s", "k9s version"],
          },
        ],
      },
    ],
  },
  {
    id: "ml",
    number: 12,
    title: "Machine Learning",
    tagline: "GPU toolkit, frameworks & isolated environments",
    icon: "BrainCircuit",
    color: "from-fuchsia-500 to-purple-600",
    sections: [
      {
        title: "GPU & Environment Manager",
        items: [
          {
            id: "cuda-toolkit",
            label: "Install CUDA Toolkit (if NVIDIA GPU present)",
            commands: ["nvcc --version"],
          },
          {
            id: "ml-miniconda",
            label: "Confirm Miniconda is installed",
            commands: ["conda --version"],
          },
        ],
      },
      {
        title: "Frameworks",
        items: [
          {
            id: "pytorch-install",
            label: "Install PyTorch",
            commands: [
              "conda create -n pytorch-env python=3.11 -y",
              "conda activate pytorch-env",
              "conda install pytorch torchvision torchaudio pytorch-cuda -c pytorch -c nvidia -y",
            ],
          },
          {
            id: "tf-install",
            label: "Install TensorFlow",
            commands: [
              "conda create -n tf-env python=3.11 -y",
              "conda activate tf-env",
              "pip install tensorflow",
            ],
          },
          {
            id: "ml-jupyter",
            label: "Install JupyterLab in each environment",
            commands: ["conda install -c conda-forge jupyterlab -y"],
          },
        ],
      },
      {
        title: "Project Isolation",
        items: [
          {
            id: "ml-envs",
            label: "Create a separate Conda env per project",
            commands: ["conda create -n project-name python=3.11 -y", "conda env list"],
          },
        ],
      },
    ],
  },
  {
    id: "databases",
    number: 13,
    title: "Databases (Docker)",
    tagline: "Containerized databases — nothing installed on Windows",
    icon: "Database",
    color: "from-amber-500 to-orange-600",
    sections: [
      {
        title: "Run via Docker",
        items: [
          {
            id: "db-postgres",
            label: "PostgreSQL",
            commands: [
              "docker run --name postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16",
            ],
          },
          {
            id: "db-mongo",
            label: "MongoDB",
            commands: ["docker run --name mongodb -p 27017:27017 -d mongo:7"],
          },
          {
            id: "db-redis",
            label: "Redis",
            commands: ["docker run --name redis -p 6379:6379 -d redis:7"],
          },
          {
            id: "db-mysql",
            label: "MySQL (when needed)",
            commands: [
              "docker run --name mysql -e MYSQL_ROOT_PASSWORD=root -p 3306:3306 -d mysql:8",
            ],
          },
        ],
      },
      {
        title: "Best Practice",
        items: [
          {
            id: "db-compose",
            label: "Prefer docker-compose for persistence & reuse",
            note: "Define volumes for each service so data survives container restarts. Avoid installing databases directly on Windows.",
          },
        ],
      },
    ],
  },
];

export const totalItemCount = phases.reduce(
  (sum, phase) => sum + phase.sections.reduce((s, sec) => s + sec.items.length, 0),
  0
);
