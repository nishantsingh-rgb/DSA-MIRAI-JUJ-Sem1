#include <iostream>
#include <iomanip>
#include <vector>
using namespace std;

int main() {
    vector<int> marks = {78, 85, 92, 64, 70};
    int n = marks.size();

    int sum = 0;
    for (int x : marks) {
        sum += x;
    }
    cout << "Sum = " << sum << endl;
    cout << "sum / n (integer division) = " << sum / n << endl;

    double avg = (double)sum / n;       // convert BEFORE dividing
    cout << fixed << setprecision(2);
    cout << "Average = " << avg << endl;
    return 0;
}
