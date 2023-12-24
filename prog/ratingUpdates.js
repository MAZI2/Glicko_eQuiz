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


/*
async function findPreviousRatings(examId, userRating, user) {
    const q='SELECT * FROM exercise_ratings_dev WHERE classExamId='+examId;
    const res = await query(q);

    //print(res);
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
*/
//PRESLIKAJ V ENOLICNE EXAMIDJE
/*
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
//enolicniId();
*/

function query(q) {
    return new Promise((resolve, reject) => {
      con.query(q, function (err, result) {
        if (err) reject(err);
        resolve(result);
      });
    });
}

function print(result) {
    for(var i=0;i<result.length;i++) {
        r=result[i];
        console.log(r.id + " " + r.exerciseId  + " " + r.rating + " " + r.ratingELO + " " + r.classExamId )
    }
}

var c=0;
async function testRating(arr, corr, tempUser, user, examId) {
    var tempUserRating=tempUser;
//    console.log("P "+tempUser);

    for(var i=0;i<arr.length;i++) {
        var tempExerciseRating=arr[i].ratingELO;
          let R1 = Math.pow(10, tempExerciseRating / 66);
          let R2 = Math.pow(10, tempUserRating / 66);
            //EXPECTED SCORE
          let E1 = R1 / (R1 + R2);
          let E2 = R2 / (R1 + R2);
          if(corr[i]==0 || corr[i]==2){
            R1 = parseInt(tempExerciseRating + 4.5 * (1 - E1));
            R2 = parseInt(tempUserRating + 4.5 * (0 - E2));
          }
          else{
              //K = 4.5
            R1 = parseInt(tempExerciseRating + 4.5 * (0 - E1));
            R2 = parseInt(tempUserRating + 4.5 * (1 - E2));
          }
            //ITERATE
          //console.log('E ' + R1);
          //console.log('U ' + R2);
          tempUserRating = R2;
          //must update!

            const q2='UPDATE computed_exercise_ratings SET ratingELO=' + R1 + ' WHERE classExamId=' + examId + ' AND exerciseId=' + arr[i].exerciseId;
            //console.log(q2)
            await query(q2);

    }

    const q1='UPDATE computed_user_ratings SET rating=' + tempUserRating + ' WHERE classExamId=' + examId;
    //console.log(q1)
    await query(q1);
    console.log(c+","+user+","+tempUserRating + ",");

    return new Promise((resolve, reject) => {
        resolve(1);
    });

}


async function findELO(examId, userRatingPrev, user) {
    const q='SELECT * FROM computed_exercise_ratings WHERE classExamId='+examId;
    const res = await query(q);

    //print(res);
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

    await testRating(arr, corr, userRatingPrev, user, examId);

    return new Promise((resolve, reject) => {
        resolve(1);
    });

}

async function updateRatings() {
    console.log("id,user,rating");
    
//    const q='SELECT * FROM joined_ratings_dev ORDER BY finishedAt ASC';
      const q='SELECT * FROM computed_user_ratings';

    const res = await query(q);
    for(var i=0;i<res.length;i++) {
        /*
    
        i=0;
        var res=[];
        res[0]=res2[8];
        */
        //find prev rating from database
//        const q6='SELECT a.rating FROM (SELECT * FROM joined_ratings_dev ORDER BY finishedAt ASC) AS a WHERE a.id<' + 
        const q6='SELECT a.rating FROM computed_user_ratings a WHERE a.id<' + 
            res[i].id + " AND a.userId='" + res[i].userId + "'";
        const rating = await query(q6);
        if(rating.length==0 || rating[rating.length-1].rating==-1)
//            await findPreviousRatings(res[i].classExamId, 200, res[i].userId);
              await findELO(res[i].classExamId, 200, res[i].userId);
 
        else {
//            await findPreviousRatings(res[i].classExamId, rating[rating.length-1].rating, res[i].userId);
              await findELO(res[i].classExamId, rating[rating.length-1].rating, res[i].userId);

        }
        c++;
    }
    process.exit();
}

updateRatings();
//findPreviousRatings(1142, 116);
