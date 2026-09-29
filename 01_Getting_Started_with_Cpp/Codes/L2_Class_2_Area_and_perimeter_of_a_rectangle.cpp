#include <iostream>
using namespace std;

int main() {
    double length = 12.5, breadth = 8.0;

    double area = length * breadth;
    double perimeter = 2 * (length + breadth);

    cout << "Area      : " << area << endl;
    cout << "Perimeter : " << perimeter << endl;
    return 0;
}
