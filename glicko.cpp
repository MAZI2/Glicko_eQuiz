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
        return 1/sqrt(1+(3*q*q*rd*rd)/(M_PI*M_PI));
    }
    double newR(Player &p, vector<pair<Player*, int>> &match) {
        double a=0;
        for(int i=0;i<match.size();i++) {
            a+=(p.g(match[i].first->rd)*(match[i].second-p.E(p, *match[i].first)));
        }
        return r+(q/(1/(p.rd*p.rd)+1/p.dsq(p, match)))*a;
    }
    double E(Player &p, Player &mp) {
        return 1/(1+pow(10, (-p.g(mp.rd)*(p.r-mp.r))/400));
    }
    double dsq(Player &p, vector<pair<Player*, int>> &match) {
        double a=0;
        for(int i=0;i<match.size();i++) {
            a+=(pow(p.g(match[i].first->rd), 2)*p.E(p, *match[i].first)*(1-p.E(p, *match[i].first)));
        }
        return 1/(q*q*a);
    }
    double rdNew(Player &p, vector<pair<Player*, int>> &match) {
        return sqrt(1/(1/(p.rd*p.rd)+1/dsq(p, match)));
    }

};


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
    p.r=p.newR(p, ma);
    p.rd=p.rdNew(p, ma);
    cout<<p.r<<" "<<p.rd<<endl;

    p.r=p.newR(p, mb);
    p.rd=p.rdNew(p, mb);
    cout<<p.r<<" "<<p.rd<<endl;

    p.r=p.newR(p, mc);
    p.rd=p.rdNew(p, mc);
    cout<<p.r<<" "<<p.rd<<endl;

    p.r=p.newR(p, md);
    p.rd=p.rdNew(p, md);
    cout<<p.r<<" "<<p.rd<<endl;

    cout<<endl;
    p.r=1500.f;
    p.rd=350.f;

    p.r=p.newR(p, ma);
    p.rd=p.rdNew(p, ma);
    cout<<p.r<<" "<<p.rd<<endl;

    p.rdPeriod(p, 2);
    p.r=p.newR(p, mc);
    p.rd=p.rdNew(p, mc);

    cout<<p.r<<" "<<p.rd<<endl;
    
    return 0;
}
