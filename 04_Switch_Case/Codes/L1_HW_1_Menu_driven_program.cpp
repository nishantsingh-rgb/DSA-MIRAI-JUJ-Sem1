#include <iostream>
using namespace std;

int main() {
    int choice;
    cout << "1. Add\n2. Subtract\n3. Multiply\n4. Divide\n";
    cout << "Enter your choice: ";
    cin >> choice;

    double a, b;
    cout << "Enter two numbers: ";
    cin >> a >> b;

    switch (choice) {
        case 1: cout << "Sum: " << (a + b) << endl; break;
        case 2: cout << "Difference: " << (a - b) << endl; break;
        case 3: cout << "Product: " << (a * b) << endl; break;
        case 4:
            if (b != 0) cout << "Quotient: " << (a / b) << endl;
            else cout << "Error: division by zero" << endl;
            break;
        default: cout << "Invalid choice" << endl;
    }
    return 0;
}
