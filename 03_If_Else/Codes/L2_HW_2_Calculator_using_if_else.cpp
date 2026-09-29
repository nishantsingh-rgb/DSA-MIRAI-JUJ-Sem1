#include <iostream>
using namespace std;

int main() {
    double a, b;
    char op;

    cout << "Enter expression (e.g. 5 + 3): ";
    cin >> a >> op >> b;

    if (op == '+') {
        cout << "Result: " << (a + b) << endl;
    } else if (op == '-') {
        cout << "Result: " << (a - b) << endl;
    } else if (op == '*') {
        cout << "Result: " << (a * b) << endl;
    } else if (op == '/') {
        if (b != 0) cout << "Result: " << (a / b) << endl;
        else cout << "Error: division by zero" << endl;
    } else {
        cout << "Invalid operator" << endl;
    }
    return 0;
}
