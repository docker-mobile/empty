const https = require('https');
const fs = require('fs');
const { exec } = require('child_process');
const path = require('path');

// URL of the file to download
const fileUrl = 'https://github.com/tsl0922/ttyd/releases/download/1.7.7/ttyd.x86_64';
const filePath = path.join(__dirname, 'ttyd.x86_64');

// Function to download a file
const downloadFile = (url, dest) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(`Download failed. Status code: ${response.statusCode}`);
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve); // Close the file and resolve the promise
            });
        }).on('error', (err) => {
            fs.unlink(dest); // Delete the file if there's an error
            reject(err.message);
        });
    });
};

// Function to set file permissions
const setFilePermissions = (filePath) => {
    return new Promise((resolve, reject) => {
        fs.chmod(filePath, 0o777, (err) => { // Set permissions to 777
            if (err) {
                reject(`Failed to set permissions: ${err.message}`);
            } else {
                resolve();
            }
        });
    });
};

// Function to run the command
const runCommand = (command) => {
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error executing command: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Error output: ${stderr}`);
            return;
        }
        console.log(`Output:\n${stdout}`);
    });
};

// Main function to orchestrate the download, permission change, and execution
const main = async () => {
    try {
        console.log('Downloading file...');
        await downloadFile(fileUrl, filePath);
        console.log('Download complete.');

        console.log('Setting file permissions...');
        await setFilePermissions(filePath);
        console.log('Permissions set to 777.');

        console.log('Running the command...');
        runCommand(`./${path.basename(filePath)} -p 80 -W bash`);
    } catch (error) {
        console.error(`Error: ${error}`);
    }
};

// Start the process
main();
