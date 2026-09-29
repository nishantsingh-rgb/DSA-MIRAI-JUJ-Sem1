#include <iostream>
using namespace std;

int main() {
    double a = 5, b = 5, c = 5;

    if (a == b && b == c) {
        cout << "Equilateral triangle" << endl;
    } else if (a == b || b == c || a == c) {
        cout << "Isosceles triangle" << endl;
    } else {
        cout << "Scalene triangle" << endl;
    }
    return 0;
}
