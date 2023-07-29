import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();

function getFiles(dir, files_){
    files_ = files_ || [];
    let files = fs.readdirSync(dir);
    for (let i in files){
        let name = dir + '/' + files[i];
        if (fs.statSync(name).isDirectory()){
            getFiles(name, files_);
        } else {
            files_.push(name);
        }
    }
    return files_;
}

app.get('/file-list', (req, res) => {
    let directoryPath = join(__dirname, 'public');
    let files = getFiles(directoryPath);
    res.send(files);
});

app.listen(3000, () => console.log('Server is running...'));
