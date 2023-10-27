const http = require("http");
const url = require("url");
const fs = require("fs");
const os = require("os");
const mockData = require("./mock.json");

function updateMockData(data) {
    fs.writeFileSync("./mock.json", JSON.stringify(data, null, 4));
}

function getUserList(response) {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify(mockData, null, 4));
}

function getUserByID(response, userId) {
    const user = mockData.find((u) => u.id === parseInt(userId));
    if (user) {
        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(user, null, 4));
    } else {
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.end("User not found");
    }
}

function updateUser(response, userId, status, friends) {
    const user = mockData.find((u) => u.id === parseInt(userId));
    if (user) {
        user.status = status;
        const friendsArray = friends.split(",");

        friendsArray.forEach((friendId) => {
            const friend = mockData.find((u) => u.id === parseInt(friendId));
            if (friend && !user.friends.includes(friend.id)) {
                user.friends.push(friend.id);
            }
            if (friend && !friend.friends.includes(user.id)) {
                friend.friends.push(user.id);
                friend.friends.sort((a, b) => a - b);
            }
        });
        user.friends.sort((a, b) => a - b);

        updateMockData(mockData);

        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(mockData, null, 4));
    } else {
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.end("User not found");
    }
}

function deleteUser(response, userId) {
    const index = mockData.findIndex((u) => u.id === parseInt(userId));
    if (index !== -1) {
        mockData.splice(index, 1);

        mockData.forEach((user) => {
            const friendIndex = user.friends.indexOf(parseInt(userId));
            if (friendIndex !== -1) {
                user.friends.splice(friendIndex, 1);
            }
        });

        updateMockData(mockData);

        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(mockData, null, 4));
    } else {
        response.writeHead(404, { "Content-Type": "text/plain" });
        response.end("User not found");
    }
}

function createUser(response, id, firstName, lastName, status) {
    id = parseInt(id);
    if (!mockData.some(u => u.id === id)) {
        const newUser = {
            id,
            firstName,
            lastName,
            status,
            friends: [],
        };

        mockData.push(newUser);
        mockData.sort((a, b) => a.id - b.id);
        updateMockData(mockData);

        response.writeHead(200, { "Content-Type": "application/json" });
        response.end(JSON.stringify(mockData, null, 4));
    } else {
        response.writeHead(400, { "Content-Type": "text/plain" });
        response.end("Invalid or duplicate ID");
    }
}

function getSync(response) {
    const start = new Date();
    try {
        const data = fs.readFileSync("readFile.txt", "utf8");
        const end = new Date();
        const time = end - start;
        console.log(`Sync done in ${time} ms`);
        response.writeHead(200, { "Content-Type": "text/plain" });
        response.end(data);
    } catch (err) {
        response.writeHead(500, { "Content-Type": "text/plain" });
        response.end("Error reading file synchronously: " + err.message);
    }
}

function getAsync(response) {
    const start = new Date();
    fs.readFile("readFile.txt", "utf8", (err, data) => {
        if (err) {
            response.writeHead(500, { "Content-Type": "text/plain" });
            response.end("Error reading file asynchronously: " + err.message);
            return;
        }
        const end = new Date();
        const time = end - start;
        console.log(`Async done in ${time} ms`);
        response.writeHead(200, { "Content-Type": "text/plain" });
        response.end(data);
    });
}

function osInfo(response) {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("Check console");
    console.log("OS Info:");
    console.log(`- OS: ${os.type().split("_")[0]}`);
    console.log(`- OS version: ${os.release()}`);
    console.log(`- Architecture: ${os.arch()}`);
    
    if (os.arch() === "x64") {
        console.log(`- RAM: ${(os.totalmem() / (1024 * 1024 * 1024)).toFixed(2)} GB`);
        console.log(`- User: ${os.userInfo().username}`);
    }
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    if (pathname === "/") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.write("Welcome to my server. Go to the URL you are interested in)\n\n");
        res.write("Available URLs:\n\n");
        res.write("1. /getuserlist\n");
        res.write("2. /getuserbyid?id=<user_id>\n");
        res.write("3. /updateuser?id=<user_id>&status=<new_status>&friends=<friend_id1>,<friend_id2>...\n");
        res.write("4. /deleteuser?id=<user_id>\n");
        res.write("5. /createuser?id=<user_id>&firstname=<first_name>&lastname=<last_name>&status=<status>\n");
        res.write("6. /getsync\n");
        res.write("7. /getasync\n");
        res.write("8. /osinfo");
        res.end();
    } else if (pathname === "/getuserlist") {
        getUserList(res);
    } else if (pathname === "/getuserbyid" && parsedUrl.query.id) {
        getUserByID(res, parsedUrl.query.id);
    } else if (pathname === "/updateuser" && parsedUrl.query.id) {
        updateUser(res, parsedUrl.query.id, parsedUrl.query.status, parsedUrl.query.friends);
    } else if (pathname === "/deleteuser" && parsedUrl.query.id) {
        deleteUser(res, parsedUrl.query.id);
    } else if (pathname === "/createuser" && parsedUrl.query.id && parsedUrl.query.firstname && parsedUrl.query.lastname && parsedUrl.query.status) {
        createUser(res, parsedUrl.query.id, parsedUrl.query.firstname, parsedUrl.query.lastname, parsedUrl.query.status);
    } else if (pathname === "/getsync") {
        getSync(res);
    } else if (pathname === "/getasync") {
        getAsync(res);
    } else if (pathname === "/osinfo") {
        osInfo(res);
    } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
    }
});

const hostname = "127.0.0.1";
const port = 3000;
server.listen(port, hostname, () => {
    console.log(`Server is running at http://${hostname}:${port}/`);
});
