const express = require('express');
const app = express();
const axios = require('axios');
const path = require('path');
const xml2js = require('xml2js');
const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');
const { Pool } = require('pg');
const nodemailer = require('nodemailer');
const moment = require('moment');
const bodyParser = require('body-parser'); 
const { HttpsProxyAgent } = require('https-proxy-agent');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
 const pool = new Pool({
     user: 'postgres',
     host: 'localhost',
     database: 'node_postgres',
     password: 'root',
     port: 5432,
});

app.use(express.urlencoded({ extended: true }));
    
const transporter = nodemailer.createTransport({
    host:"smtp.yandex.ru",
    port: 465,
    secure: true,
    auth: {
        user: 'plekhanovam.v@yandex.ru', // ваша почта
        pass: 'yrpfggywmvtyfeeo' // ваш пароль
    }
});


let clientData = {};// Объект для хранения данных клиента

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

app.use(bodyParser.json());

const MORPHER_API_URL = 'https://ws3.morpher.ru/russian/declension';

// Функция для получения дательного падежа из API Morpher
const getDativeCase = async (word) => {
    try {
        const response = await axios.get(`${MORPHER_API_URL}?s=${encodeURIComponent(word)}`);
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        return result.xml.Д[0]; // Извлекаем дательный падеж
    } catch (error) {
        console.error(`Ошибка при склонении слова ${word}:`, error);
        throw error;
    }
};


const getRodCase = async (word) => {
    try {
        const response = await axios.get(`${MORPHER_API_URL}?s=${encodeURIComponent(word)}`);
        const parser = new xml2js.Parser();
        const result = await parser.parseStringPromise(response.data);
        return result.xml.Р[0]; 
    } catch (error) {
        console.error(`Ошибка при склонении слова ${word}:`, error);
        throw error;
    }
};

app.post('/Further', async (req, res) => {
    const { surname, name, patronymic, group, Teacher, one, two, three, four, DataStart, DataEnd } = req.body;
    const teacherParts = Teacher.split(' ');
        const teacherLastName = teacherParts[0];
        const teacherFirstName = teacherParts[1];
        const teacherPatronymic = teacherParts[2];

        const teacherRewardsMap = {
            "Алексеев Михаил Николаевич": "кандидат педагогических наук, доцент кафедры вычислительной механики и информационных технологий",
            "Алексеева Татьяна Михайловна": "кандидат педагогических наук, доцент кафедры вычислительной механики и информационных технологий",
            "Дементьев Олег Николаевич": "доктор физико-математических наук, профессор кафедры вычислительной механики и информационных технологий",
            "Маковецкий Артём Юрьевич": "кандидат физико-математических наук, доцент кафедры вычислительной механики и информационных технологий",
            "Плеханова Марина Васильевна": "доктор физико-математических наук, профессор кафедры вычислительной механики и информационных технологий",
            "Шабанов Тимофей Юрьевич": "кандидат экономических наук, доцент кафедры вычислительной механики и информационных технологий"
        };
        const teacherRewards = teacherRewardsMap[Teacher];

        // Получаем первые буквы имени и отчества преподавателя
        const teacherNameInitial = teacherFirstName ? teacherFirstName.substring(0, 1) : '';
        const teacherPatronymicInitial = teacherPatronymic ? teacherPatronymic.substring(0, 1) : '';
    try {
        // Получение дательного падежа для фамилии, имени и отчества
        const [surnameDative, nameDative, patronymicDative] = await Promise.all([
            getDativeCase(surname),
            getDativeCase(name),
            getDativeCase(patronymic)
        ]);

        const [surnamerod, namerod, patronymicrod] = await Promise.all([
            getRodCase(surname),
            getRodCase(name),
            getRodCase(patronymic)
        ]);

        let templatePath = '';
        let templatePath2 = '';
        let templatePath3 = '';
        let templatePath4 = '';
        switch (group) {
            case 'МН-101':
                templatePath = path.join(__dirname, 'templates', 'МН-1', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МН-1', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МН-1', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МН-1', 'Дневник.docx');
                break;
            case 'МН-102':
                templatePath = path.join(__dirname, 'templates', 'МН-1', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МН-1', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МН-1', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МН-1', 'Дневник.docx');
                break;
            case 'МП-101':
                templatePath = path.join(__dirname, 'templates', 'МП-1', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МП-1', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МП-1', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МП-1', 'Дневник.docx');
                break;
            case 'МП-102':
                templatePath = path.join(__dirname, 'templates', 'МП-1', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МП-1', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МП-1', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МП-1', 'Дневник.docx');
                break;
            case 'МП-103':
                templatePath = path.join(__dirname, 'templates', 'МП-1', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МП-1', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МП-1', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МП-1', 'Дневник.docx');
                break;
            case 'МТ-101':
                templatePath = path.join(__dirname, 'templates', 'МТ-1', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МТ-1', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МТ-1', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МТ-1', 'Дневник.docx');
                break;
            case 'МТ-102':
                templatePath = path.join(__dirname, 'templates', 'МТ-1', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МТ-1', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МТ-1', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МТ-1', 'Дневник.docx');
                break;
            case 'МТ-103':
                templatePath = path.join(__dirname, 'templates', 'МП-1', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МП-1', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МП-1', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МП-1', 'Дневник.docx');
                break;
            case 'МТ-201':
                templatePath = path.join(__dirname, 'templates', 'МТ-2', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МТ-2', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МТ-2', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МТ-2', 'Дневник.docx');
                break;
            case 'МТ-202':
                templatePath = path.join(__dirname, 'templates', 'МТ-2', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МТ-2', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МТ-2', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МТ-2', 'Дневник.docx');
                break;
            case 'МТ-301':
                templatePath = path.join(__dirname, 'templates', 'МТ-3', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МТ-3', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МТ-3', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МТ-3', 'Дневник.docx');
                break;
            case 'МТ-302':
                templatePath = path.join(__dirname, 'templates', 'МТ-3', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МТ-3', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МТ-3', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МТ-3', 'Дневник.docx');
                break;
            case 'МТ-401':
                templatePath = path.join(__dirname, 'templates', 'МТ-4', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МТ-4', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МТ-4', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МТ-4', 'Дневник.docx');
                break;
            case 'МТ-402':
                templatePath = path.join(__dirname, 'templates', 'МТ-4', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МТ-4', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МТ-4', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МТ-4', 'Дневник.docx');
                break;
            case 'МагМТ-101':
                templatePath = path.join(__dirname, 'templates', 'МагМТ-101', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МагМТ-101', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МагМТ-101', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МагМТ-101', 'Дневник.docx');
                break;
            case 'МагМТ-201':
                templatePath = path.join(__dirname, 'templates', 'МагМТ-201', 'Инд_задание.docx');
                templatePath2 = path.join(__dirname, 'templates', 'МагМТ-201', 'Отчёт.docx');
                templatePath3 = path.join(__dirname, 'templates', 'МагМТ-201', 'Характеристика.docx');
                templatePath4 = path.join(__dirname, 'templates', 'МагМТ-201', 'Дневник.docx');
                break;
        }
        // Загружаем шаблон документа

        const content = fs.readFileSync(templatePath);
        const content2 = fs.readFileSync(templatePath2);
        const content3 = fs.readFileSync(templatePath3);
        const content4 = fs.readFileSync(templatePath4);
        const zip = new PizZip(content);
        const zip2 = new PizZip(content2);
        const zip3 = new PizZip(content3);
        const zip4 = new PizZip(content4);
        const doc = new Docxtemplater();
        const doc2 = new Docxtemplater();
        const doc3 = new Docxtemplater();
        const doc4 = new Docxtemplater();
        doc.loadZip(zip);
        doc2.loadZip(zip2);
        doc3.loadZip(zip3);
        doc4.loadZip(zip4);

        // Получить первые буквы имени и отчества
        const nameInitial = name.substring(0, 1);
        const patronymicInitial = patronymic.substring(0, 1);

        if (!DataStart || !DataEnd) {
            console.error('DataStart или DataEnd не определены');
            return res.status(400).send('Ошибка: Неверно введены даты!');
        }

        // Проверка корректности дат
        const dataStart = moment(DataStart, 'YYYY-MM-DD'); 
        const dataEnd = moment(DataEnd, 'YYYY-MM-DD');

        // Проверяем, является ли дата корректной
        if (!dataStart.isValid() || !dataEnd.isValid()) {
            console.error('Не правильный формат');
            return res.status(400).send('Ошибка: Неверный формат дат!');
        }

        // Вычисление продолжительности практики
        const duration = dataEnd.diff(dataStart, 'days'); 

        // Деление практики на 4 равные части
        const durationPart = Math.floor(duration / 4);

        // Создание массива дат для каждой части практики
        const dates = [];
        let currentData = dataStart.clone();
        dates.push(currentData.format('DD.MM.YYYY')); // Добавляем начало
        for (let i = 0; i < 3; i++) {
            currentData.add(durationPart, 'days');
            dates.push(currentData.format('DD.MM.YYYY'));
        }
        dates.push(dataEnd.format('DD.MM.YYYY')); // Добавляем конец

        // Создание массива с интервалами
        const intervals = [];
        for (let i = 0; i < dates.length - 1; i++) {
            intervals.push(`${dates[i]}-${dates[i + 1]}`);
        }

        // Преобразование интервалов так, чтобы каждый второй интервал был смещен на один день
        intervals.forEach((interval, index) => {
            const [startDate, endDate] = interval.split('-');
            const startMoment = moment(startDate, 'DD.MM.YYYY');
        if (index >= 1 && index <= 3) {
            const newStartDate = startMoment.add(1, 'days').format('DD.MM.YYYY');
            intervals[index] = `${newStartDate}-${endDate}`;
        }
        });
        const intervals1 = intervals[0];
        const intervals2 = intervals[1];
        const intervals3 = intervals[2];
        const intervals4 = intervals[3];
        // Заполняем шаблон данными клиента
        const data = {
            surname: surname,
            name: name,
            patronymic: patronymic,
            nameInitial: nameInitial,
            patronymicInitial: patronymicInitial,
            group: group,
            teacherLastName: teacherLastName,
            teacherFirstName: teacherFirstName,
            teacherPatronymic: teacherPatronymic,
            teacherNameInitial: teacherNameInitial,
            teacherPatronymicInitial: teacherPatronymicInitial,
            teacherRewards: teacherRewards,
            one: one,
            two: two,
            three: three,
            four: four,
            DataStartFull: dataStart.format('DD.MM.YYYY'), // Полный формат начальной даты
            DataStartYear: dataStart.format('YYYY'), // Только год начальной даты
            DataEndFull: dataEnd.format('DD.MM.YYYY'), // Полный формат окончательной даты
            DataEndYear: dataEnd.format('YYYY'), // Только год окончательной даты
            intervals: intervals, // Массив интервалов для каждой части практики
            intervals1: intervals1,
            intervals2: intervals2,
            intervals3: intervals3,
            intervals4: intervals4,
            surnameDative: surnameDative, // Добавляем дательный падеж фамилии в данные
            nameDative: nameDative,
            patronymicDative: patronymicDative,
            surnamerod: surnamerod, // Добавляем дательный падеж фамилии в данные
            namerod: namerod,
            patronymicrod: patronymicrod
        };

        doc.setData({
            ...data,
        });

        doc2.setData({
            ...data,
        });
        doc3.setData({
            ...data,
        });
        doc4.setData({
            ...data,
        });

        // Рендерим документ
        doc.render();
        doc2.render();
        doc3.render();
        doc4.render();

        // Получаем отрендеренный документ в виде буфера
        const buffer = doc.getZip().generate({ type: 'nodebuffer' });
        const buffer2 = doc2.getZip().generate({ type: 'nodebuffer' });
        const buffer3 = doc3.getZip().generate({ type: 'nodebuffer' });
        const buffer4 = doc4.getZip().generate({ type: 'nodebuffer' });

        // Определяем пути к файлам
        const documentPath1 = path.join(__dirname, 'documents', 'Инд_задание.docx');
        const documentPath2 = path.join(__dirname, 'documents', 'Отчёт.docx');
        const documentPath3 = path.join(__dirname, 'documents', 'Характеристика.docx');
        const documentPath4 = path.join(__dirname, 'documents', 'Дневник.docx');

        // Записываем буфер в новые файлы с использованием относительных путей
        fs.writeFileSync(documentPath1, buffer);
        fs.writeFileSync(documentPath2, buffer2);
        fs.writeFileSync(documentPath3, buffer3);
        fs.writeFileSync(documentPath4, buffer4);      

        // Сохраняем данные клиента
        clientData.surname = surname;
        clientData.group = group;
        clientData.nameInitial = nameInitial;
        clientData.patronymicInitial = patronymicInitial;

        res.sendFile(__dirname + '/index2.html');
    } catch (error) {
        console.error('Ошибка при сохранении данных:', error);
        res.status(500).send('Произошла ошибка при сохранении данных.');
    }
});
app.post('/submit_email', async (req, res) => {
    const { email } = req.body;
    const { surname, group, nameInitial, patronymicInitial} = clientData; // Получаем данные о фамилии и группе из промежуточного хранилища
    try {
        const mailOptions = {
            from: 'plekhanovam.v@yandex.ru',
            to: email,
            subject: `Документы практики ${surname} ${nameInitial}.${patronymicInitial}. ${group}`, // Здесь добавлено  ФИО студента
            text: '',
            attachments: [
                {
                    filename: 'Инд_задание.docx',
                    path: path.join(documentsDirectory, 'Инд_задание.docx')
                },
                {
                    filename: 'Отчёт.docx',
                    path: path.join(documentsDirectory, 'Отчёт.docx')
                },
                {
                    filename: 'Характеристика.docx',
                    path: path.join(documentsDirectory, 'Характеристика.docx')
                },
                {
                    filename: 'Дневник.docx',
                    path: path.join(documentsDirectory, 'Дневник.docx')
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent to: ' + email);
        res.status(200).json({ email: email });
    } catch (error) {
        console.error('Ошибка при отправке письма:', error);
        res.status(500).json({ error: 'Произошла ошибка при отправке письма.' });
    }
});
const documentsDirectory = path.join(__dirname, 'documents');
app.post('/submit_emailTeacher', async (req, res) => {
    const { emailTeacher } = req.body;
    const { surname, group, nameInitial, patronymicInitial} = clientData; // Получаем данные о фамилии и группе из промежуточного хранилища
    try {
        const mailOptions = {
            from: 'plekhanovam.v@yandex.ru',
            to: emailTeacher,
            subject: `Документы практики ${surname} ${nameInitial}.${patronymicInitial}. ${group}`, // Здесь добавлено  ФИО студента
            text: '',
            attachments: [
                {
                    filename: 'Инд_задание.docx',
                    path: path.join(documentsDirectory, 'Инд_задание.docx')
                },
                {
                    filename: 'Отчёт.docx',
                    path: path.join(documentsDirectory, 'Отчёт.docx')
                },
                {
                    filename: 'Характеристика.docx',
                    path: path.join(documentsDirectory, 'Характеристика.docx')
                },
                {
                    filename: 'Дневник.docx',
                    path: path.join(documentsDirectory, 'Дневник.docx')
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        console.log('Email sent to: ' + emailTeacher);
        res.status(200).json({ email: emailTeacher });
    } catch (error) {
        console.error('Ошибка при отправке письма:', error);
        res.status(500).json({ error: 'Произошла ошибка при отправке письма.' });
    }
});
// Путь к папке с документами
const documentsFolder = path.join(__dirname, 'documents');
app.get('/download1', (req, res) => {
    const fileName = 'Инд_задание.docx';  // Имя файла для скачивания
    const filePath = path.join(documentsFolder, fileName); // Полный путь к файлу

    try {
        // Отправляем файл пользователю как ответ на запрос
        res.download(filePath, fileName, (error) => {
            if (error) {
                console.error('Ошибка при скачивании файла:', error);
                res.status(500).send('Произошла ошибка при скачивании файла.');
            }
        });
    } catch (error) {
        console.error('Ошибка при скачивании файла:', error);
        res.status(500).send('Произошла ошибка при скачивании файла.');
    }
});
app.get('/download2', (req, res) => {
    const fileName = 'Отчёт.docx';  // Имя файла для скачивания
    const filePath = path.join(documentsFolder, fileName); // Полный путь к файлу

    try {
        // Отправляем файл пользователю как ответ на запрос
        res.download(filePath, fileName, (error) => {
            if (error) {
                console.error('Ошибка при скачивании файла:', error);
                res.status(500).send('Произошла ошибка при скачивании файла.');
            }
        });
    } catch (error) {
        console.error('Ошибка при скачивании файла:', error);
        res.status(500).send('Произошла ошибка при скачивании файла.');
    }
});

app.get('/download3', (req, res) => {
    const fileName = 'Характеристика.docx';  // Имя файла для скачивания
    const filePath = path.join(documentsFolder, fileName); // Полный путь к файлу

    try {
        // Отправляем файл пользователю как ответ на запрос
        res.download(filePath, fileName, (error) => {
            if (error) {
                console.error('Ошибка при скачивании файла:', error);
                res.status(500).send('Произошла ошибка при скачивании файла.');
            }
        });
    } catch (error) {
        console.error('Ошибка при скачивании файла:', error);
        res.status(500).send('Произошла ошибка при скачивании файла.');
    }
});
app.get('/download4', (req, res) => {
    const fileName = 'Дневник.docx';  // Имя файла для скачивания
    const filePath = path.join(documentsFolder, fileName); // Полный путь к файлу

    try {
        // Отправляем файл пользователю как ответ на запрос
        res.download(filePath, fileName, (error) => {
            if (error) {
                console.error('Ошибка при скачивании файла:', error);
                res.status(500).send('Произошла ошибка при скачивании файла.');
            }
        });
    } catch (error) {
        console.error('Ошибка при скачивании файла:', error);
        res.status(500).send('Произошла ошибка при скачивании файла.');
    }
});
process.on('SIGINT', () => {
    console.log('Сервер завершает работу');
    process.exit();
});

app.listen(3000, () => {
    console.log('Сервер запущен на порту 3000');
});
