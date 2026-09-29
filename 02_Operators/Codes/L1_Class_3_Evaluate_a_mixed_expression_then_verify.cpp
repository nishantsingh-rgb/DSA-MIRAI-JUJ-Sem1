#include <iostream>
using namespace std;

int main() {
    int a = 7, b = 3, c = 2;

    // Precedence: * and / before +, evaluated left to right
    int result = a + b * c - a / b;

    cout << "Expression : a + b * c - a / b" << endl;
    cout << "Result     : " << result << endl;

    // Manual verification
    int step1 = b * c;      // 3 * 2 = 6
    int step2 = a / b;      // 7 / 3 = 2 (integer division)
    int verify = a + step1 - step2;

    cout << "Verified   : " << verify << endl;
    return 0;
}
