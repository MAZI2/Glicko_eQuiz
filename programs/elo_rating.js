var mysql = require('mysql');

var fs = require('fs');
var util = require('util');
var log_file = fs.createWriteStream(__dirname + '/debug.log', {flags : 'w'});
var log_stdout = process.stdout;

var con = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "adminadmin",
  database: "glicko"
});

function query(q) {
    return new Promise((resolve, reject) => {
      con.query(q, function (err, result) {
        if (err) reject(err);
        resolve(result);
      });
    });
}

//COMPUTE USER AND EXERCISE RATINGS BASED ON PROVIDED MATCH
async function computeELO(arr, corr, tempUser, user, examId) {
    var tempUserRating=tempUser;

    for(var i=0;i<arr.length;i++) {
        var tempExerciseRating=arr[i].ratingELO;
        let R1 = Math.pow(10, tempExerciseRating / 66);
        let R2 = Math.pow(10, tempUserRating / 66);
        let E1 = R1 / (R1 + R2);
        let E2 = R2 / (R1 + R2);
        if(corr[i]==0 || corr[i]==2) {
            R1 = parseInt(tempExerciseRating + 4.5 * (1 - E1));
            R2 = parseInt(tempUserRating + 4.5 * (0 - E2));
        } else {
            R1 = parseInt(tempExerciseRating + 4.5 * (0 - E1));
            R2 = parseInt(tempUserRating + 4.5 * (1 - E2));
        }

        tempUserRating = R2;

        const q2='UPDATE computed_exercise_ratings SET ratingELO=' + R1 + ' WHERE classExamId=' + examId + ' AND exerciseId=' + arr[i].exerciseId;
        await query(q2);
    }

    const q1='UPDATE computed_user_ratings SET rating=' + tempUserRating + ' WHERE classExamId=' + examId;
    await query(q1);

    return new Promise((resolve, reject) => {
        resolve(1);
    });
}

//ARRANGE MATCH WITH PREVIOUS EXERCISE RATINGS AND OUTCOMES
async function findELO(examId, userRatingPrev, user) {
    const q='SELECT * FROM computed_exercise_ratings WHERE classExamId='+examId;
    const res = await query(q);

    var arr=[];
    var corr=[];

    //vse naloge v quizu
    for( i=0;i<res.length;i++) {
        //poglej pod tem exerciseIdjem in enega pred tem examIdjem
        const q2='SELECT * FROM computed_exercise_ratings WHERE id<' + res[i].id + ' AND exerciseId=' + res[i].exerciseId; 
        const resArr = await query(q2);


        var res1 = resArr[resArr.length-1];
        if(resArr.length==0 || res1.ratingELO == -1)
            res1 = {ratingELO: 200, exerciseId: res[i].exerciseId};

        //previous exercise ratings
        arr.push(res1);
        corr.push(res[i].correct)
    }

    await computeELO(arr, corr, userRatingPrev, user, examId);

    return new Promise((resolve, reject) => {
        resolve(1);
    });

}
async function updateRatings() {
    const q='SELECT * FROM computed_user_ratings';
    const res = await query(q);

    for(var i=0;i<res.length;i++) {
        const q6='SELECT a.rating FROM computed_user_ratings a WHERE a.id<' + 
            res[i].id + " AND a.userId='" + res[i].userId + "'";
        const rating = await query(q6);
        if(rating.length==0 || rating[rating.length-1].rating==-1)
              await findELO(res[i].classExamId, 200, res[i].userId);
 
        else {
              await findELO(res[i].classExamId, rating[rating.length-1].rating, res[i].userId);
        }
    }
    process.exit();
}

