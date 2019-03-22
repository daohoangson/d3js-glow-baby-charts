# Glow Baby Charts

## Usage

1. Go to https://glow-baby-charts-master.daohoangson.now.sh/
1. Upload your `baby.db` file (see below for details)
1. Enjoy

### How to get the database file

Use any Android file explorer to get the file at `/data/data/com.glow.android.baby/databases/baby.db`.
Your device must be rooted for this to work.

As an alternative, use `adb` (Android Debug Bridge) to pull the file (root is still required):

```bash
# in computer shell
adb shell

# in Android shell
su

# in Android root shell
cp /data/data/com.glow.android.baby/databases/baby.db /sdcard/baby.db
exit
exit

# in computer shell
adb pull /sdcard/baby.db baby.db

# done, the file is in your current directory
```

## Development

### 1. Start node Docker container (optional)

You can skip this step if you are comfortable with running arbitrary code on your computer.

```bash
./docker.sh
```

### 2. Prepare environment

```bash
# install dependencies from lock file
npm i

# generate merged.json
./tool/generate-merged-json.ts
```

### 3. Start server

```bash
npm run dev
```

Go to http://localhost:5000/ to view charts.
