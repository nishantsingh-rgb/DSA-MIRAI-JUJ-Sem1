#include <iostream>
using namespace std;

int main() {
    int year = 2024;

    bool isLeap = (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0);

    cout << boolalpha;
    cout << year << " is a leap year: " << isLeap << endl;
    return 0;
}
