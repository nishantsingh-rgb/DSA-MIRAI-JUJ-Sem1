#include <iostream>
using namespace std;

int main() {
    int month;
    int year = 2024;
    cout << "Enter month number (1-12): ";
    cin >> month;

    int days;
    switch (month) {
        case 1: case 3: case 5: case 7: case 8: case 10: case 12:
            days = 31;
            break;
        case 4: case 6: case 9: case 11:
            days = 30;
            break;
        case 2:
            if ((year % 4 == 0 && year % 100 != 0) || (year % 400 == 0))
                days = 29;
            else
                days = 28;
            break;
        default:
            days = -1;
    }

    if (days == -1) cout << "Invalid month" << endl;
    else cout << "Days in month: " << days << endl;
    return 0;
}
