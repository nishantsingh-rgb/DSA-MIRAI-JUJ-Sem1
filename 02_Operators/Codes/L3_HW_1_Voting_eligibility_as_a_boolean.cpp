#include <iostream>
using namespace std;

int main() {
    int age = 19;
    bool isIndianCitizen = true;

    bool canVote = (age >= 18) && isIndianCitizen;

    cout << boolalpha;
    cout << "Can vote: " << canVote << endl;
    return 0;
}
