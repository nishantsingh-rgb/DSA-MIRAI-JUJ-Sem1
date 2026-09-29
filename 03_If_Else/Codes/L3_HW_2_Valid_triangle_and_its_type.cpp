#include <iostream>
using namespace std;

int main() {
    double a, b, c;
    cout << "Enter three sides: ";
    cin >> a >> b >> c;

    bool isValid = (a + b > c) && (b + c > a) && (a + c > b);

    if (!isValid) {
        cout << "Not a valid triangle" << endl;
    } else if (a == b && b == c) {
        cout << "Valid triangle: Equilateral" << endl;
    } else if (a == b || b == c || a == c) {
        cout << "Valid triangle: Isosceles" << endl;
    } else {
        cout << "Valid triangle: Scalene" << endl;
    }
    return 0;
}
