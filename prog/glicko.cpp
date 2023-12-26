#include <iostream>
#include <string>
#include <algorithm>
#include <random>
#include <math.h>
#include <queue>
using namespace std;

int c=60;
double q=0.0057565f;

class Player {
public:
    double r;
    double rd;

    Player(double R, double RD) {
       r=R;
       rd=RD;
    }

    void rdPeriod(Player &p, int t) {
        p.rd = min(sqrt(p.rd*p.rd + c*c*t), (double)350.f);
    }

    double g(double rd) {
        //printf("g %f", 1/sqrt(1+(3*q*q*rd*rd)/(M_PI*M_PI)));
        return 1/sqrt(1+(3*q*q*rd*rd)/(M_PI*M_PI));
    }
    double newR(Player &p, vector<pair<Player*, int>> &match) {
        double a=0;
        for(int i=0;i<match.size();i++) {
            a+=(p.g(match[i].first->rd)*(match[i].second-p.E(p, *match[i].first)));
        }
        return p.r+(q/(1/(p.rd*p.rd)+1/p.dsq(p, match)))*a;
    }
    //ex
    double newRSingle(Player &p, pair<Player*, int> &mpair) {
        double a=0;

        a+=(p.g(mpair.first->rd)*(mpair.second-p.E(p, *mpair.first)));
        return p.r+(q/(1/(p.rd*p.rd)+1/p.dsqSingle(p, mpair)))*a;
    }
    double E(Player &p, Player &mp) {
        //printf("E %f\n", 1/(1+pow(10, (-p.g(mp.rd)*(p.r-mp.r))/400)));
        return 1/(1+pow(10, (-p.g(mp.rd)*(p.r-mp.r))/400));
    }
    double dsq(Player &p, vector<pair<Player*, int>> &match) {
        double a=0;
        for(int i=0;i<match.size();i++) {
            a+=(pow(p.g(match[i].first->rd), 2)*p.E(p, *match[i].first)*(1-p.E(p, *match[i].first)));
        }
        return 1/(q*q*a);
    }
    //ex m, p i
    double dsqSingle(Player &p, pair<Player*, int> &mpair) {
        double a=0;

        a+=(pow(p.g(mpair.first->rd), 2)*p.E(p, *mpair.first)*(1-p.E(p, *mpair.first)));
        //printf("dsq %f\n", 1/(q*q*a));
        return 1/(q*q*a);
    }
    double rdNew(Player &p, vector<pair<Player*, int>> &match) {
        return sqrt(1/(1/(p.rd*p.rd)+1/dsq(p, match)));
    }
    //ex
    double rdNewSingle(Player &p, pair<Player*, int> &mpair) {
        return sqrt(1/(1/(p.rd*p.rd)+1/dsqSingle(p, mpair)));
    }

};

int userRating(Player &p, vector<pair<Player*, int>> &match) {
    p.r=p.newR(p, match);
    printf("%f\n", p.r);
    return p.r;
}
int exerciseRating(Player &p, vector<pair<Player*, int>> &match) {
    for(auto [m, i] : match) {
        pair<Player*, int> mpair={&p, !i};
        printf("%f %f %d\n", m->r, mpair.first->r, mpair.second);


        printf("%f  ", m->r);
        m->r=p.newRSingle(*m, mpair);
        m->rd=p.rdNewSingle(*m, mpair);
        printf("%f %f\n", m->r, m->rd);
    };

    return 0;
}

int main() {
    Player p(1500.f, 350.f);
    Player a(1400.f, 100.f);
    Player b(1550.f, 100.f);
    Player c(1700.f, 100.f);
    Player d(1300.f, 100.f);

    vector<pair<Player* , int>> match = {
        {&a,1}, 
        {&b,1}, 
        {&c,1},
        {&d,1}
    };
vector<pair<Player*, int>> ma = {{&a,1}};
vector<pair<Player*, int>> mb = {{&b,1}};
vector<pair<Player*, int>> mc = {{&c,1}};
vector<pair<Player*, int>> md = {{&d,1}};

cout << exerciseRating(p, match) << endl;

//must calculate userRating with temporary array
cout << userRating(p, match) << endl;
   
    return 0;
}
