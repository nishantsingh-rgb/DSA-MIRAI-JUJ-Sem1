#include <iostream>
using namespace std;

int main() {
    double principal = 5000.0;
    double rate = 6.5;
    double time = 3.0;

    double simpleInterest = (principal * rate * time) / 100.0;

    cout << "Principal : " << principal << endl;
    cout << "Rate      : " << rate << "%" << endl;
    cout << "Time      : " << time << " years" << endl;
    cout << "Simple Interest : " << simpleInterest << endl;
    return 0;
}
