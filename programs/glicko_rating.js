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
async function computeGlicko(arr, corr, tempUser, prevRd, user, examId, prevUserTime, examTime) {
    var p={r:tempUser, rd:prevRd};

    var t=0;
    if(prevUserTime!=-1) {
        let date1 = new Date(prevUserTime);
        let curr = new Date(examTime);
        t = parseInt((curr - date1)/(1000 * 3600 * 24));
    }

    //update rd from time 
    p.rd=rdPeriod(p, t);
    var match=[];

    //naloge v examu
    for(var i=0;i<arr.length;i++) {
        match.push({
            first:{r:arr[i].ratingELO, rd:arr[i].rd, exerciseId:arr[i].exerciseId, 
            classExamId: arr[i].classExamId,
            t:arr[i].finishedAt
            }, second:corr[i]});
    }
    var res = await userRating(p, match);
    await exerciseRating(p, match);

    const q1='UPDATE computed_user_ratings_glicko SET rating=' + parseInt(res.r) + ', rd=' + res.rd + ' WHERE classExamId=' + examId;
    await query(q1);

    return new Promise((resolve, reject) => {
        resolve(1);
    });
}

//ARRANGE MATCH WITH PREVIOUS EXERCISE RATINGS AND OUTCOMES
async function findGlicko(examId, userRatingPrev, userRDPrev, user, examTime, prevUserTime) {
    //exercises
    const q='SELECT * FROM computed_exercise_ratings_glicko WHERE classExamId='+examId;
    const res = await query(q);

    var arr=[];
    var corr=[];

    //vse naloge v quizu
    for( i=0;i<res.length;i++) {
        //poglej pod tem exerciseIdjem in enega pred tem examIdjem
        const q2='SELECT * FROM computed_exercise_ratings_glicko WHERE id<' + res[i].id + ' AND exerciseId=' + res[i].exerciseId; 
        const resArr = await query(q2);

        var res1 = resArr[resArr.length-1];
        if(resArr.length==0 || res1.ratingELO == -1) {
            res1 = {ratingELO: 1000, exerciseId:-1, rd:350, examId:-1, finishedAt:-1};
        }
        res1.exerciseId=res[i].exerciseId;
        res1.classExamId=examId;

        var t=0;
        if(res1.finishedAt!=-1) {
            let date1 = new Date(res1.finishedAt);
            let curr = new Date(examTime);
            t = parseInt((curr - date1)/(1000 * 3600 * 24));
        }
        res1.finishedAt=t;

        //previous exercise ratings
        arr.push(res1);
        corr.push(res[i].correct)
    }

    await computeGlicko(arr, corr, userRatingPrev, userRDPrev, user, examId, prevUserTime, examTime);

    return new Promise((resolve, reject) => {
        resolve(1);
    });
}

//SETS USER RATING BASED ON MATCH PROVIDED
async function userRating(p, match) {
    var temp=match;
    var pp=p;

    var rres=newR(pp, temp);
    rres=Math.max(rres, 0);
    var rdres=rdNew(pp, temp);
    rdres=Math.max(rdres, 0);
    rdres=Math.min(rdres, 350);

    return new Promise((resolve, reject) => {
        resolve({r:rres, rd:rdres});
    });
}

//SETS EXERCISE RATINGS BASED ON MATCH PROVIDED
async function exerciseRating(p, match) {
    for(var i=0;i<match.length;i++) {
        var m=match[i].first;
        var s=match[i].second;
        var mpair={first:p, second:!s};

        //update rd from time
        m.rd=rdPeriod(m, m.t);
        //update rd from match
        m.r=newRSingle(m, mpair);
        m.r=Math.max(m.r, 0);
        m.rd=rdNewSingle(m, mpair);
        m.rd=Math.max(m.rd, 0);
        m.rd=Math.min(m.rd, 350);

        const q2='UPDATE computed_exercise_ratings_glicko SET ratingELO=' + parseInt(m.r) + ', rd=' + m.rd + ' WHERE classExamId=' + m.classExamId + ' AND exerciseId=' + m.exerciseId;
         await query(q2);
    };

    return new Promise((resolve, reject) => {
        resolve(1);
    });
}

async function updateRatings() {
    const q='SELECT * FROM computed_user_ratings_glicko';

    const res = await query(q);
    //examIds
    for(var i=0;i<res.length;i++) {
        //find prev rating from database for this examId
        const q6='SELECT * FROM computed_user_ratings_glicko a WHERE a.id<' + 
            res[i].id + " AND a.userId='" + res[i].userId + "'";
        const rating = await query(q6);
        if(rating.length==0 || rating[rating.length-1].rating==-1)
              await findGlicko(res[i].classExamId, 1000, 350, res[i].userId, res[i].finishedAt, -1);
 
        else {
              await findGlicko(res[i].classExamId, rating[rating.length-1].rating, rating[rating.length-1].rd, res[i].userId, res[i].finishedAt, rating[rating.length-1].finishedAt);
        }
    }
    process.exit();
}


