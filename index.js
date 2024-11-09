const http = require('http');
const { exec } = require('child_process');
const https = require('https');
const fs = require('fs');

// Define the URL and the path to save the binary
const tmateUrl = 'https://github.com/docker-mobile/empty/raw/refs/heads/main/tmate';
const tmatePath = './tmate';
const nohupOutputPath = './nohup.out';

// Function to download the tmate binary
const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close(resolve);
      });
    }).on('error', (err) => {
      fs.unlink(dest);
      reject(err.message);
    });
  });
};

// Function to run tmate in the background
const runTmate = () => {
  return new Promise((resolve, reject) => {
    exec(`chmod +x ${tmatePath} && nohup ./${tmatePath} -F > ${nohupOutputPath} 2>&1 &`, (error) => {
      if (error) {
        reject(`Error executing tmate: ${error.message}`);
      } else {
        resolve();
      }
    });
  });
};

// Function to read the nohup.out file
const readNohupOutput = () => {
  return new Promise((resolve, reject) => {
    fs.readFile(nohupOutputPath, 'utf8', (err, data) => {
      if (err) {
        reject(`Error reading nohup.out: ${err.message}`);
      } else {
        resolve(data);
      }
    });
  });
};

// Create an HTTP server
const server = http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/start-tmate') {
    try {
      await downloadFile(tmateUrl, tmatePath);
      console.log('tmate downloaded successfully.');
      
      await runTmate();
      console.log('tmate is running in the background.');

      // Wait for a moment to ensure nohup.out has some output
      setTimeout(async () => {
        try {
          const output = await readNohupOutput();
          res.writeHead(200, { 'Content-Type': 'text/plain' });
          res.end(output); // Return the output from nohup.out
        } catch (readError) {
          res.writeHead(500, { 'Content-Type': 'text/plain' });
          res.end(`Error reading nohup.out: ${readError}`);
        }
      }, 5000); // Adjust the timeout as necessary

    } catch (error) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Failed to execute: ${error}`);
    }
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

// Start the server
const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
