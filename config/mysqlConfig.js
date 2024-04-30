var mysql = require('mysql2');
var util = require('util');
var pool = mysql.createPool({
    connectionLimit: 3,
    host: '158.247.239.126',
    port: '3306',
    user: 'realcoco_app',
    password: 'Realcoco12!@',
    database: 'realcoco',
    timezone: 'KST'
});

pool.getConnection((err, connection) => {
    if (err) {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') { console.error('Database connection was closed.'); }
        if (err.code === 'ER_CON_COUNT_ERROR') { console.error('Database has too many connections.'); }
        if (err.code === 'ECONNREFUSED') { console.error('Database connection was refused.'); }
    }
    if (connection) connection.release()
    return;
});
pool.query = util.promisify(pool.query);
module.exports = pool;
