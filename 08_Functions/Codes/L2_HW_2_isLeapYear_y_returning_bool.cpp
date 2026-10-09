#include <iostream>
using namespace std;

bool isLeapYear(int y) {
    return (y % 4 == 0 && y % 100 != 0) || (y % 400 == 0);
}

int main() {
    int years[4] = {1900, 2000, 2024, 2026};
    for (int i = 0; i < 4; i++) {
        if (isLeapYear(years[i])) cout << years[i] << " is a leap year" << endl;
        else cout << years[i] << " is not a leap year" << endl;
    }
    return 0;
}
