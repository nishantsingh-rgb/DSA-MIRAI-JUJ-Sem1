#include <iostream>
using namespace std;

int main() {
    double radius;
    cout << "Enter radius: ";
    cin >> radius;

    const double PI = 3.14159;
    double area = PI * radius * radius;

    cout << "Area of circle : " << area << endl;
    return 0;
}
