#include <iostream>
using namespace std;

int main() {
    double m1, m2, m3;
    cout << "Enter marks in 3 subjects: ";
    cin >> m1 >> m2 >> m3;

    double total = m1 + m2 + m3;
    double average = total / 3.0;

    cout << "Total   : " << total << endl;
    cout << "Average : " << average << endl;
    return 0;
}
