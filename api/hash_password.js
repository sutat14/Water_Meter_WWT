const bcrypt = require('bcryptjs');

const password = '7000899'; // รหัสผ่านที่ต้องการ
bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, (err, hash) => {
        console.log(hash); // จะแสดงรหัสผ่านที่ถูกเข้ารหัสแล้วใน console
    });
});