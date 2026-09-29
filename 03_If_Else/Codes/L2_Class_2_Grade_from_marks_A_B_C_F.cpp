#include <iostream>
using namespace std;

int main() {
    int marks;
    cout << "Enter marks (0-100): ";
    cin >> marks;

    char grade;
    if (marks >= 90) grade = 'A';
    else if (marks >= 75) grade = 'B';
    else if (marks >= 40) grade = 'C';
    else grade = 'F';

    cout << "Grade: " << grade << endl;
    return 0;
}
