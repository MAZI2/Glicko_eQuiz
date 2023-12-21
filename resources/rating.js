async function updateUserRating(userId, groupId, attemptId, classExamId) {
  let response = null;
  let oldUserRating = 0;
  let tempUser = await UserRating.select('rating').where('userId', userId).where('groupId', groupId).orderBy('id', 'desc').first();
  if(tempUser == null){
    oldUserRating = 200;
  }
  else{
    oldUserRating = tempUser.toJSON().rating;
  }
  let tempUserRating = oldUserRating;

  let att = await Bookshelf.knex('user_ratings').select('id', 'rating').where('userId', userId).where('groupId', groupId).where('classExamId', classExamId).orderBy('id', 'desc');

    //KO NOV REQUEST CE JE RATING ZA EXAM ZE ... POTEM VRNE ZADNJEGA IN TOCKE PRI TEM ATTEMPTU
  if(att.length > 0){
    // rating za ta izpit je ze izracunan
    let hist = await Bookshelf.knex('user_ratings').select('id', 'rating').where('userId', userId).where('groupId', groupId).orderBy('id', 'desc');
    let res = await ExamAttempts.select(['points', 'maxPoints']).where('id', attemptId).first();
    res = res.toJSON();
    // pridobi predhodni rating
    // iskanje tega ratinga v tabeli
    let i = 0;
    while (i < hist.length && hist[i].id !== att[0].id) {
      i++;
    }
    response = {"oldRating" : (i+1) < hist.length ? hist[i+1].rating : 200, "newRating" : att[0].rating, "points" : res.points, "maxPoints" : res.maxPoints};
  }
    //DRUGACE GRE PO NALOGAH IN 
  else{
    // rating za ta izpit je potrebno se izracunati
    let examId = await ClassExam.select('examId').where('id', classExamId).first();
    examId = examId.toJSON().examId;

    // pridobi vse naloge iz tega izpita
    let exerciseVersionIds = await Bookshelf.knex('exam_exercises').select('exerciseVersionId').where('examId', examId);

    //loop po nalogah, za vsako nalogo dobi vse njene GUID-je in nato za vsakega preveri
    //ce je zadnja oddaja bila pravilna ali ne in izracuna rating ter vpise v bazo
    for(let i = 0; i < exerciseVersionIds.length; i++){
      let oldExerciseRating = 0;
      let exerciseForId = await getExerciseFromDB(null, exerciseVersionIds[i].exerciseVersionId);
      let tempExercise = await ExerciseRating.select('ratingELO').where('exerciseId', exerciseForId.toJSON().exerciseId).orderBy('id', 'desc').first();
      if(tempExercise == null){
        oldExerciseRating = 200;
      }
      else{
          //VSAK EXERCISE ZADNJI NJEN RATING
        oldExerciseRating = tempExercise.toJSON().ratingELO;
      }
      let tempExerciseRating = oldExerciseRating;
        //
      let guids = await Bookshelf.knex('events').distinct('questionGUID').where('exerciseVersionId', exerciseVersionIds[i].exerciseVersionId);
      if(guids.length == 0){
        //ce uporabnik ni resil naloge
        let g = await getExerciseFromDB(null, exerciseVersionIds[i].exerciseVersionId);
        //let g1 = g.toJSON().data.questions.map(q => q.guid);
        for(let j = 0; j < g.toJSON().data.questions.length; j++){
          let R1 = Math.pow(10, tempExerciseRating / 66);
          let R2 = Math.pow(10, tempUserRating / 66);
          let E1 = R1 / (R1 + R2);
          let E2 = R2 / (R1 + R2);
          R1 = parseInt(tempExerciseRating + 4.5 * (1 - E1));
          R2 = parseInt(tempUserRating + 4.5 * (0 - E2));
          tempExerciseRating = R1;
          tempUserRating = R2;
        }
      } else {
        // uporabnik je resil nalogo
        for(let j = 0; j < guids.length; j++){
          let correct = (await Events.select('correct').where('exerciseVersionId', exerciseVersionIds[i].exerciseVersionId)
          .where('questionGUID', guids[j].questionGUID).where('examAttemptId', attemptId).orderBy('id', 'desc').first());
            //ZADNJA ODDAJA NALOGE?
          if(correct != null){
            correct = correct.toJSON().correct;
          }
          //izracun ratinga
          let R1 = Math.pow(10, tempExerciseRating / 66);
          let R2 = Math.pow(10, tempUserRating / 66);
            //EXPECTED SCORE
          let E1 = R1 / (R1 + R2);
          let E2 = R2 / (R1 + R2);
          if(correct == 0 || correct == null){
            R1 = parseInt(tempExerciseRating + 4.5 * (1 - E1));
            R2 = parseInt(tempUserRating + 4.5 * (0 - E2));
          }
          else{
              //K = 4.5
            R1 = parseInt(tempExerciseRating + 4.5 * (0 - E1));
            R2 = parseInt(tempUserRating + 4.5 * (1 - E2));
          }
            //ITERATE
          tempExerciseRating = R1;
          tempUserRating = R2;
        }
      }
      //vpis novega ratinga naloge
      let eRating = new ExerciseRating({
        exerciseId: exerciseForId.toJSON().exerciseId,
        ratingElo: tempExerciseRating,
        classExamId: classExamId
      });
      await eRating.save();
    }

    //ko se izracuna rating vseh nalog (hkrati tudi uporabnika), se vpise rating uporabnika
    let uRating = new UserRating({
      userId: userId,
      groupId: groupId,
      rating: tempUserRating,
      classExamId: classExamId
    });
    await uRating.save();

    //pripravi odgovor, ki vsebuje stari in novi rating uporabnika ter stevilo dosezenih tock
    let results = await ExamAttempts.select(['points', 'maxPoints']).where('id', attemptId).first();
    results = results.toJSON();
    response = {"oldRating" : oldUserRating, "newRating" : tempUserRating, "points" : results.points, "maxPoints" : results.maxPoints};
  }
  return response;
}
