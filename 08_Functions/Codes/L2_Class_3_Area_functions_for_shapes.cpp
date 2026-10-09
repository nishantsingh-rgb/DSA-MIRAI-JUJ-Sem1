#include <iostream>
using namespace std;

double areaOfCircle(double radius) {
    return 3.14159 * radius * radius;
}

double areaOfRectangle(double length, double width) {
    return length * width;
}

double areaOfTriangle(double base, double height) {
    return 0.5 * base * height;
}

int main() {
    cout << "Circle (r = 5): " << areaOfCircle(5) << endl;
    cout << "Rectangle (4 x 6): " << areaOfRectangle(4, 6) << endl;
    cout << "Triangle (b = 8, h = 3): " << areaOfTriangle(8, 3) << endl;
    return 0;
}
