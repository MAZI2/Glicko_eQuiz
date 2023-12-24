#include <iostream>
#include <string>
#include <algorithm>
#include <random>
#include <math.h>
#include <queue>
using namespace std;

int main() {
    /*
     +------+--------------------------------------+---------+--------+-------------+
| id   | userId                               | groupId | rating | classExamId |
+------+--------------------------------------+---------+--------+-------------+
| 1526 | 50f7688e-d6d5-4e8b-a713-f66cc6def95f |       7 |    200 |        2678 |
| 1527 | 50f7688e-d6d5-4e8b-a713-f66cc6def95f |       7 |    182 |        2681 |
| 1528 | 50f7688e-d6d5-4e8b-a713-f66cc6def95f |       7 |    177 |        2682 |


+-------+------------+--------+-----------+-------------+
| id    | exerciseId | rating | ratingELO | classExamId |
+-------+------------+--------+-----------+-------------+
| 16541 | 2371       |      0 |       204 |        2681 |202
| 16542 | 2440       |      0 |       196 |        2681 |194
| 16543 | 1867       |      0 |       148 |        2681 |149
| 16544 | 1906       |      0 |       176 |        2681 |173
| 16545 | 1991       |      0 |       146 |        2681 |
| 16546 | 2101       |      0 |       170 |        2681 |
| 16547 | 2111       |      0 |       167 |        2681 |
| 16548 | 2120       |      0 |       169 |        2681 |
| 16549 | 2146       |      0 |       183 |        2681 |
+-------+------------+--------+-----------+-------------+

//SELECT * FROM exercise_ratings_dev WHERE exerciseId=1142;

200->182
    for(exerciseId with ClassExamId ==  &&  exercise[0] se ne ponovi)
    select largest id until examId == (extract rating) -> this is previous rating of exercise
    SELECT * FROM exercise_ratings WHERE exerciseId=1906;
     */

    double E=173;
    double U=197;

    double R1=pow(10, E/66);
    double R2=pow(10, U/66);

    double E1 = R1 / (R1 + R2);
    double E2 = R2 / (R1 + R2);

    int correct=0;
    if(correct == 0 ){
        R1 = E + 4.5 * (1 - E1);
        R2 = U + 4.5 * (0 - E2);

      cout << "E " << R1 << endl;
      cout << "U " << R2 << endl;

      }
      else{
        R1 = E + 4.5 * (0 - E1);
        R2 = U + 4.5 * (1 - E2);

      cout << "E " << R1 << endl;
      cout << "U " << R2 << endl;
      }

      return 0;
}
