var mysql = require('mysql');

var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var log_stdout = process.stdout;

console.log = function(d) { //
  log_file.write(util.format(d) + '\n');
  log_stdout.write(util.format(d) + '\n');
};

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "adminadmin",
  database: "glicko"
});

var maxExamId = 7657;

function query(q) {
    return new Promise((resolve, reject) => {
      con.query(q, function (err, result) {
        if (err) reject(err);
        resolve(result);
      });
    });
}

//FUNCTION FOR DETERMINING EXERCISE CORRECT/WRONG
async function findPreviousRatings(examId, userRating, user) {
    const q='SELECT * FROM exercise_ratings_dev WHERE classExamId='+examId;
    const res = await query(q);

    var arr=[];
    var corr=[];

    //vse naloge v quizu
    for( i=0;i<res.length;i++) {
        //poglej pod tem exerciseIdjem in enega pred tem examIdjem
        const q2='SELECT * FROM exercise_ratings_dev WHERE id<' + res[i].id + ' AND exerciseId=' + res[i].exerciseId; 
        const resArr = await query(q2);


        var res1 = resArr[resArr.length-1];
        if(resArr.length==0)
            res1 = {ratingELO: 200, exerciseId: res[i].exerciseId};

        if(res1.ratingELO<=res[i].ratingELO)
            correct=0;
        else
            correct=1;

        arr.push(res1);

        corr.push(correct);

        const q3='UPDATE exercise_ratings_dev SET correct=' + correct + ' WHERE id=' + res[i].id;

        await query(q3);
    }


    await testRating(arr, corr, userRating, user, examId);

    return new Promise((resolve, reject) => {
        resolve(1);
    });

}

//PRESLIKAJ POSKUSE ISTEGA EXAMA V ENOLICNE EXAMIDJE
async function enolicniId() {
    const q2='SELECT classExamId, COUNT(userId) AS count FROM joined_ratings_dev GROUP BY classExamId HAVING COUNT(userId)>1;';
    con.connect(function(err) {
      if (err) reject(err);
    })

    const res1 = await query(q2);


    for(var i=0;i<res1.length;i++) {
        var examId = res1[i].classExamId;
        const q3='SELECT * FROM exercise_ratings_dev WHERE classExamId=' + examId;
        const res2 = await query(q3);

        const prvi=res2[0].exerciseId;
        const prviExamId=res2[0].classExamId;
        for(var j=0;j<res2.length;j++) {
            if(res2[j].exerciseId==prvi && res2[j].classExamId == prviExamId) {
                maxExamId++;

                //settaj prvega iz user ratings
                q5='UPDATE joined_ratings_dev SET classExamId=' + maxExamId + ' WHERE classExamId=' + examId + ' LIMIT 1';
                await query(q5);
                console.log(examId + " -> " + maxExamId);
            }
            //settaj sproti iz exercise ratings
            q4='UPDATE exercise_ratings_dev SET classExamId=' + maxExamId + 
                ' WHERE classExamId=' + examId + ' AND exerciseId=' + res2[j].exerciseId + ' LIMIT 1';

            await query(q4);
        }
    }
}
