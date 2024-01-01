//---------------------------------------------------------------
//..................
async function updateUserRating(userId, groupId, attemptId, classExamId) {
    let tempUserRating = //retrieve latest user rating
    let tempUserRD = // retrieve latest user RD
    let userTime = //retrieve time of latest user rating
    let timeOfExam = //retrieve time of exam

    //DEFAULT USER RATING
    if(tempUser == null){
        tempUserRating = 1000;
        tempUserRD = 350;
        userTime = -1;
    } else{
        tempUserRating = tempUser.toJSON().rating;
        tempUserRD = tempUser.toJSON().rd;
        userTime = tempUser.toJSON().finishedAt;
    }

    // pridobi vse naloge iz tega izpita
    let exerciseVersionIds = //retrieve exerciseIds of this exam

    //loop po nalogah, za vsako nalogo dobi vse njene GUID-je in nato za vsakega preveri
    //ce je zadnja oddaja bila pravilna ali ne in izracuna rating ter vpise v bazo
    //LOOP CEZ RAZLICNE NALOGE
    for(let i = 0; i < exerciseVersionIds.length; i++){
      let oldExerciseRating = 0;
      let oldExerciseRD = 0;
      let exerciseForId = await //pridobi exercise object     getExerciseFromDB(null, exerciseVersionIds[i].exerciseVersionId);
      let tempExercise = await //retrieve latest exercise rating
      let finishedAt = 0;
      let time = 0;

      //DEFAULT EXERCISE RATING
      if(tempExercise == null){
        oldExerciseRating = 1000;
        oldExerciseRD = 350;
        finishedAt = -1;
      } else {
        oldExerciseRating = tempExercise.toJSON().ratingELO;
        oldExerciseRD = tempExercise.toJSON().rd;
        finishedAt = tempExercise.toJSON().finishedAt;
      }
        
      if(finishedAt!=-1) {
        let date1 = new Date(res1.finishedAt);
        let curr = new Date();
        time = parseInt((curr - date1)/(1000 * 3600 * 24));
      }
      
      let tempExerciseRating = oldExerciseRating;
      let tempExerciseRD = oldExerciseRd;

      //DELI TE NALOGE IN NJIHOVA ZABELEZBA MED EVENTS
      let guids = await //pridobi resevanja te naloge med eventi

      //CE NALOGA NI RESENA TRETIRAJ KOT LOSS IN IZRACUNAJ RATING
      if(guids.length == 0){
        for(let j = 0; j < g.toJSON().data.questions.length; j++){
        //IZRACUNAJ GLICKO ZA TA EXERCISE Z OUTCOMOM 0
        //DODAJ V SEZNAM ZA NATO IZRACUN ZA USERJA

          //m={teh podatkov od prej}
//        same user(rating, rd), exercise(rating, rd, time), outcome
          //UPDATE EXERCISE BASED ON EXERCISE TIME
          tempExerciseRating=rdPeriod(m, time);
          //UPDATE Rating AND RD AND APPLY CAP
          var tempU=user;
          tempExerciseRating=Math.max(newRSingle(m, {tempU, 1}), 0);
          tempExerciseRD=Math.min(Math.max(rdNewSingle(m, {tempU, 1}), 0), 350);

          matchArray.push({m, outcome});
        };
      } else {
        // uporabnik je resil nalogo
        // sprehod skozi vprasanja te naloge in njihova resevanja
        for(let j = 0; j < guids.length; j++){
          let correct = //pridobi zadnje resevanje naloge correct?

        //IZRACUNAJ GLICKO ZA TA EXERCISE Z OUTCOMOM correct
        //DODAJ V SEZNAM ZA NATO IZRACUN ZA USERJA
        //samo uporabljaj prejsnji tempExerciseRating in RD

          //m={teh podatkov od prej}
//        same user(rating, rd), exercise(rating, rd, time), outcome
          //UPDATE EXERCISE BASED ON EXERCISE TIME
          tempExerciseRating=rdPeriod(m, time);
          //UPDATE Rating AND RD AND APPLY CAP
          var tempU=user;
          tempExerciseRating=Math.max(newRSingle(m, {tempU, !outcome}), 0);
          tempExerciseRD=Math.min(Math.max(rdNewSingle(m, {tempU, !outcome}), 0), 350);

          matchArray.push({m, outcome});
        }
      }
      //tempExerciseRating
      //vpis novega ratinga naloge v podatkovno bazo
    }
    var temp=matchArray;
    var userTime=0;
    if(prevUserTime!=-1) {
        let date1 = new Date(userTime);
        let curr = new Date(timeOfExam);
        userTime = parseInt((curr - date1)/(1000 * 3600 * 24));
    }

    //let user={user tempR, tempRD, ...}
    user.rd=rdPeriod(user, userTime);

    tempUserRating=Math.max(newR(user, temp), 0);
    tempUserRD=Math.min(Math.max(rdNew(user, temp), 0), 350);

    //ko se izracuna rating vseh nalog (hkrati tudi uporabnika), se vpise rating uporabnika
  }
}
