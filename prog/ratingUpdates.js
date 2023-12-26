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

//---------------------------------------------------------------
async function computeGlicko(arr, corr, tempUser, prevRd, user, examId, prevUserTime, examTime) {
    var tempUserRating=tempUser;
//    console.log("P "+tempUser);

        
    var p={r:tempUser, rd:prevRd};

    var t=0;
    if(prevUserTime!=-1) {
        let date1 = new Date(prevUserTime);
        let curr = new Date(examTime);
        t = parseInt((curr - date1)/(1000 * 3600 * 24));
    }

//    var temp=p.rd;
    p.rd=rdPeriod(p, t);
//    console.log(p.rd-temp)
    var match=[];

    //naloge v examu
    for(var i=0;i<arr.length;i++) {
        match.push({
            first:{r:arr[i].ratingELO, rd:arr[i].rd, exerciseId:arr[i].exerciseId, 
            classExamId: arr[i].classExamId,
            t:arr[i].finishedAt
            }, second:corr[i]});
        //console.log(match[i]);
    }
    var res = await userRating(p, match);
    await exerciseRating(p, match);

    const q1='UPDATE computed_user_ratings_glicko SET rating=' + parseInt(res.r) + ', rd=' + res.rd + ' WHERE classExamId=' + examId;
    console.log(user + " " + examId + " " +parseInt(res.r) + " " + res.rd)
    //console.log(q1)
    await query(q1);

    return new Promise((resolve, reject) => {
        resolve(1);
    });

}


async function findGlicko(examId, userRatingPrev, userRDPrev, user, examTime, prevUserTime) {
    //exercises
    const q='SELECT * FROM computed_exercise_ratings_glicko WHERE classExamId='+examId;
    const res = await query(q);

    //print(res);
    var arr=[];
    var corr=[];

    //vse naloge v quizu
    for( i=0;i<res.length;i++) {
        //poglej pod tem exerciseIdjem in enega pred tem examIdjem
        const q2='SELECT * FROM computed_exercise_ratings_glicko WHERE id<' + res[i].id + ' AND exerciseId=' + res[i].exerciseId; 
        const resArr = await query(q2);

        var res1 = resArr[resArr.length-1];
        if(resArr.length==0 || res1.ratingELO == -1) {
            res1 = {ratingELO: 200, exerciseId:-1, rd:350, examId:-1, finishedAt:-1};
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

async function exerciseRating(p, match) {
    for(var i=0;i<match.length;i++) {//auto [m, i] : match) {
        var m=match[i].first;
        var s=match[i].second;
        var mpair={first:p, second:!s};

//        var temp=m.rd;
        m.rd=rdPeriod(m, m.t);
//        console.log(m.rd-temp);
        m.r=newRSingle(m, mpair);
        m.r=Math.max(m.r, 0);
        m.rd=rdNewSingle(m, mpair);
        m.rd=Math.max(m.r, 0);
        m.rd=Math.min(m.r, 350);

        const q2='UPDATE computed_exercise_ratings_glicko SET ratingELO=' + parseInt(m.r) + ', rd=' + m.rd + ' WHERE classExamId=' + m.classExamId + ' AND exerciseId=' + m.exerciseId;
         //console.log(q2)
         await query(q2);
    };

    return new Promise((resolve, reject) => {
        resolve(1);
    });
}

async function updateRatings() {
    console.log("id,user,rating");
    const q='SELECT * FROM computed_user_ratings_glicko';

    const res = await query(q);
    //examIds
    for(var i=0;i<res.length;i++) {
        //find prev rating from database for this examId
        const q6='SELECT * FROM computed_user_ratings_glicko a WHERE a.id<' + 
            res[i].id + " AND a.userId='" + res[i].userId + "'";
        const rating = await query(q6);
        if(rating.length==0 || rating[rating.length-1].rating==-1)
              await findGlicko(res[i].classExamId, 200, 350, res[i].userId, res[i].finishedAt, -1);
 
        else {
              await findGlicko(res[i].classExamId, rating[rating.length-1].rating, rating[rating.length-1].rd, res[i].userId, res[i].finishedAt, rating[rating.length-1].finishedAt);
        }
        c++;
    }
    process.exit();
}

/*
async function updateRatings() {
    console.log("id,user,rating");
    
//    const q='SELECT * FROM joined_ratings_dev ORDER BY finishedAt ASC';
      const q='SELECT * FROM computed_user_ratings';

    const res = await query(q);
    for(var i=0;i<res.length;i++) {
        //
    
        i=0;
        var res=[];
        res[0]=res2[8];
        //
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
*/

updateRatings();
//findPreviousRatings(1142, 116);

const cc=32;


function rdPeriod(p, t) {
    return Math.min(Math.sqrt(p.rd*p.rd + cc*cc*t), 350);
}


function newR(p, match) {
    const q=0.0057565;

    var a=0;
    for(var i=0;i<match.length;i++) {
        //console.log(match[i].second);
        a+=(g(match[i].first.rd)*(match[i].second-E(p, match[i].first)));
    }
    //console.log("R" + (p.r+(q/(1/(p.rd*p.rd)+1/dsq(p, match)))*a));

    return p.r+(q/(1/(p.rd*p.rd)+1/dsq(p, match)))*a;
}


function dsq(p, match) {
    const q=0.0057565;

    var a=0;
    for(var i=0;i<match.length;i++) {
        a+=(Math.pow(g(match[i].first.rd), 2)*E(p, match[i].first)*(1-E(p, match[i].first)));
    }
    return 1/(q*q*a);
}


function rdNew(p, match) {
    return Math.sqrt(1/(1/(p.rd*p.rd)+1/dsq(p, match)));
}

function g(rd) {
    const q=0.0057565;

    //console.log("g" + 1/Math.sqrt(1+(3*q*q*rd*rd)/(Math.PI*Math.PI)));
    return 1/Math.sqrt(1+(3*q*q*rd*rd)/(Math.PI*Math.PI));
}

function E(p, mp) {
    //console.log("E" + 1/(1+Math.pow(10, (-g(mp.rd)*(p.r-mp.r))/400)));

    return 1/(1+Math.pow(10, (-g(mp.rd)*(p.r-mp.r))/400));
}
//exercises
//ex
function rdNewSingle(p, mpair) {
    return Math.sqrt(1/(1/(p.rd*p.rd)+1/dsqSingle(p, mpair)));
}

//ex m, p i
function dsqSingle(p, mpair) {
    const q=0.0057565;

    var a=0;
    a+=(Math.pow(g(mpair.first.rd), 2)*E(p, mpair.first)*(1-E(p, mpair.first)));
    //printf("dsq %f\n", 1/(q*q*a));
    return 1/(q*q*a);
}
//ex
function newRSingle(p, mpair) {
    const q=0.0057565;

    var a=0;
    a+=(g(mpair.first.rd)*(mpair.second-E(p, mpair.first)));

    //console.log("R" + (p.r+(q/(1/(p.rd*p.rd)+1/dsqSingle(p, mpair)))*a));

    return p.r+(q/(1/(p.rd*p.rd)+1/dsqSingle(p, mpair)))*a;
}
